package in.temple.backend.service.impl;

import in.temple.backend.dto.UpiDonationListItemDto;
import in.temple.backend.dto.UpiDonationRequestDto;
import in.temple.backend.dto.UpiDonationSearchRequestDto;
import in.temple.backend.model.DonationPurpose;
import in.temple.backend.model.Gotra;
import in.temple.backend.model.UpiDonation;
import in.temple.backend.model.User;
import in.temple.backend.repository.DonationPurposeRepository;
import in.temple.backend.repository.GotraRepository;
import in.temple.backend.repository.UpiDonationRepository;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.UpiDonationService;
import in.temple.backend.util.ReceiptPdfUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.image.BufferedImage;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UpiDonationServiceImpl implements UpiDonationService {

    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");
    private static final Pattern REF_LAST4_PATTERN = Pattern.compile("^[0-9]{4}$");

    private final UpiDonationRepository upiDonationRepo;
    private final DonationPurposeRepository purposeRepo;
    private final GotraRepository gotraRepository;
    private final AuthContextService authContextService;

    @Override
    @Transactional
    public byte[] createAndReturnReceiptPdf(UpiDonationRequestDto req, String username, String language) {

        validateMobile(req.getMobile());
        validateRefLast4(req.getPaymentRefLast4());

        DonationPurpose purpose = purposeRepo.findById(req.getPurposeId())
                .orElseThrow(() -> new IllegalStateException("Invalid donation purpose"));

        if (!purpose.isActive()) {
            throw new IllegalStateException("Purpose is disabled");
        }

        validateGotra(purpose, req.getGotraId());
        validateAmount(purpose, req.getAmount());

        String receiptNumber = "UPI" + upiDonationRepo.nextReceiptSequence();

        UpiDonation donation = UpiDonation.builder()
                .receiptNumber(receiptNumber)
                .donorName(req.getDonorName())
                .address(req.getAddress())
                .mobile(req.getMobile())
                .purposeId(purpose.getId())
                .purposeNameEn(purpose.getNameEn())
                .purposeNameHi(purpose.getNameHi())
                .amount(req.getAmount())
                .paymentRefLast4(req.getPaymentRefLast4())
                .createdAt(LocalDateTime.now())
                .createdBy(username)
                .active(true)
                .build();

        if (purpose.isRequiresGotra()) {
            Gotra g = gotraRepository.findById(req.getGotraId())
                    .orElseThrow(() -> new IllegalStateException("Invalid gotra"));
            donation.setGotraId(g.getId());
            donation.setGotraNameEn(g.getEnglishName());
            donation.setGotraNameHi(g.getHindiName());
        }

        UpiDonation saved = upiDonationRepo.save(donation);

        return generateReceiptPdf(saved, language);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateReceiptPdfById(Long id, String language) {
        UpiDonation donation = upiDonationRepo.findById(id)
                .orElseThrow(() -> new IllegalStateException("UPI donation not found"));
        return generateReceiptPdf(donation, language);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpiDonationListItemDto> search(UpiDonationSearchRequestDto req) {
        List<UpiDonation> results;
        if (req.getReceiptNumber() != null && !req.getReceiptNumber().isBlank()) {
            results = upiDonationRepo.findByActiveTrueAndReceiptNumberOrderByCreatedAtDesc(req.getReceiptNumber());
        } else if (req.getMobile() != null && !req.getMobile().isBlank()) {
            results = upiDonationRepo.findByActiveTrueAndMobileOrderByCreatedAtDesc(req.getMobile());
        } else {
            results = upiDonationRepo.findByActiveTrueOrderByCreatedAtDesc();
        }
        return results.stream().map(this::toListItemDto).toList();
    }

    private UpiDonationListItemDto toListItemDto(UpiDonation d) {
        UpiDonationListItemDto dto = new UpiDonationListItemDto();
        dto.setId(d.getId());
        dto.setReceiptNumber(d.getReceiptNumber());
        dto.setDonorName(d.getDonorName());
        dto.setMobile(d.getMobile());
        dto.setPurposeNameEn(d.getPurposeNameEn());
        dto.setPurposeNameHi(d.getPurposeNameHi());
        dto.setAmount(d.getAmount());
        dto.setPaymentRefLast4(d.getPaymentRefLast4());
        dto.setCreatedAt(d.getCreatedAt());
        return dto;
    }

    // =================================================
    // VALIDATIONS — same rules as cash donations
    // =================================================

    private void validateAmount(DonationPurpose purpose, BigDecimal amount) {
        if (purpose.getFixedAmount() != null) {
            if (amount == null || amount.compareTo(purpose.getFixedAmount()) != 0) {
                throw new IllegalStateException(
                        "Invalid amount. Fixed amount for this purpose is ₹" + purpose.getFixedAmount());
            }
        } else if (amount == null || amount.signum() <= 0) {
            throw new IllegalStateException("Invalid donation amount");
        }
    }

    private void validateGotra(DonationPurpose purpose, String gotraId) {
        if (purpose.isRequiresGotra() && (gotraId == null || gotraId.isBlank())) {
            throw new IllegalStateException("Gotra is required");
        }
    }

    private void validateMobile(String mobile) {
        if (mobile == null || !MOBILE_PATTERN.matcher(mobile).matches()) {
            throw new IllegalStateException("Invalid mobile number");
        }
    }

    private void validateRefLast4(String refLast4) {
        if (refLast4 == null || !REF_LAST4_PATTERN.matcher(refLast4).matches()) {
            throw new IllegalStateException("Payment reference must be the last 4 digits (numeric)");
        }
    }

    // =================================================
    // RECEIPT PDF — same visual layout as the donation receipt, but marked
    // as a UPI payment and carrying the payment reference instead of a
    // "received by" cashier signature line (this isn't cash handled at the
    // counter, so there's nothing to countersign).
    // =================================================

    private byte[] generateReceiptPdf(UpiDonation donation, String language) {
        boolean en = "en".equalsIgnoreCase(language);

        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");

            String formattedAmount = String.format("%,.0f", donation.getAmount());
            String amountInWords = en
                    ? in.temple.backend.util.HindiNumberUtil.convertEnglish(donation.getAmount())
                    : in.temple.backend.util.HindiNumberUtil.convert(donation.getAmount());
            String purposeText = en
                    ? (donation.getPurposeNameEn() != null ? donation.getPurposeNameEn() : donation.getPurposeNameHi())
                    : (donation.getPurposeNameHi() != null ? donation.getPurposeNameHi() : donation.getPurposeNameEn());
            String address = donation.getAddress() != null ? donation.getAddress() : "";

            String gotra = en
                    ? ((donation.getGotraNameEn() != null && !donation.getGotraNameEn().isBlank())
                        ? donation.getGotraNameEn()
                        : (donation.getGotraNameHi() != null ? donation.getGotraNameHi() : ""))
                    : ((donation.getGotraNameHi() != null && !donation.getGotraNameHi().isBlank())
                        ? donation.getGotraNameHi() : "");

            Font baseFont = ReceiptPdfUtil.loadDevanagariFont();

            final int SCALE  = 3;
            final int W      = 420 * SCALE;
            final int H      = 595 * SCALE;
            final int M      = 46  * SCALE;
            final int LINE_H = 22  * SCALE;
            final int HEADER_CLEARANCE = 172 * SCALE; // same pre-printed letterhead as donation receipts
            final int FOOTER_CLEARANCE = 20  * SCALE;
            final int FIELD_GAP = 8  * SCALE;
            final int GROUP_GAP = 16 * SCALE;

            Font fNormal = baseFont.deriveFont(12.0f * SCALE);
            Font fBold   = baseFont.deriveFont(Font.BOLD, 13.0f * SCALE);
            Font fTitle  = baseFont.deriveFont(Font.BOLD, 16.0f * SCALE);

            BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();

            g.setColor(Color.WHITE);
            g.fillRect(0, 0, W, H);
            g.setColor(Color.BLACK);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);

            FontRenderContext frc = g.getFontRenderContext();
            final int CONTENT_W = W - 2 * M;

            // Heading — starts right below the pre-printed header's rule
            int y = HEADER_CLEARANCE;
            String title = en ? "UPI Donation Receipt" : "यूपीआई दान रसीद";
            TextLayout titleLayout = new TextLayout(title, fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 3 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.2f * SCALE));
            g.drawLine(titleX - 6 * SCALE, titleBottom, titleX + titleW + 6 * SCALE, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 20 * SCALE;

            // Receipt number (left) & date (right)
            ReceiptPdfUtil.drawLine(g, (en ? "Receipt No: " : "रसीद क्रमांक: ") + donation.getReceiptNumber(), M, y, fBold, frc);
            String dateStr = (en ? "Date: " : "दिनांक: ") + donation.getCreatedAt().format(formatter);
            TextLayout dateLayout = new TextLayout(dateStr, fBold, frc);
            ReceiptPdfUtil.drawLine(g, dateStr, (int) (W - M - dateLayout.getBounds().getWidth()), y, fBold, frc);
            y += LINE_H + FIELD_GAP;

            g.setStroke(new java.awt.BasicStroke(0.75f * SCALE));
            g.setColor(new Color(150, 150, 150));
            g.drawLine(M, y, W - M, y);
            g.setColor(Color.BLACK);
            y += GROUP_GAP;

            // Donor
            String donorLine = en
                    ? "Received with thanks from Mr./Mrs. " + donation.getDonorName()
                    : "श्रीमान/श्रीमती " + donation.getDonorName() + " जी से सादर प्राप्त";
            y = ReceiptPdfUtil.drawWrapped(g, donorLine, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;

            y = ReceiptPdfUtil.drawWrapped(g, (en ? "Address: " : "पता: ") + address, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;
            y = ReceiptPdfUtil.drawWrapped(g, (en ? "Mobile: " : "मोबाइल: ") + donation.getMobile(), M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;

            if (!gotra.isEmpty()) {
                y = ReceiptPdfUtil.drawWrapped(g, (en ? "Gotra: " : "गोत्र: ") + gotra, M, y, CONTENT_W, fNormal, frc, LINE_H);
                y += FIELD_GAP;
            }

            // Amount — marked as UPI, not cash
            String amountLine = en
                    ? "Amount: Rs. " + formattedAmount + "/- (" + amountInWords + ") UPI"
                    : "राशि: ₹ " + formattedAmount + " /- (" + amountInWords + ") यूपीआई";
            y = ReceiptPdfUtil.drawWrapped(g, amountLine, M, y, CONTENT_W, fBold, frc, LINE_H);
            y += FIELD_GAP;

            // Payment reference — last 4 digits only, shown as XXXX1234
            String refLine = (en ? "UPI Ref: " : "यूपीआई संदर्भ: ") + "XXXX" + donation.getPaymentRefLast4();
            y = ReceiptPdfUtil.drawWrapped(g, refLine, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;

            // Purpose — one line, like every field above it
            String purposeLine = en
                    ? "For: " + purposeText + " Donation"
                    : "उद्देश्य: " + purposeText + " हेतु दान राशि";
            y = ReceiptPdfUtil.drawWrapped(g, purposeLine, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += GROUP_GAP - FIELD_GAP;

            g.setStroke(new java.awt.BasicStroke(0.75f * SCALE));
            g.setColor(new Color(150, 150, 150));
            g.drawLine(M, y, W - M, y);
            g.setColor(Color.BLACK);
            y += GROUP_GAP;

            // Same "Received by" line as the cash donation receipt, naming
            // whoever generated the bill at the counter.
            String cashierName;
            try {
                User cashier = authContextService.getLoggedInUser(donation.getCreatedBy());
                cashierName = (cashier.getName() != null && !cashier.getName().isBlank())
                        ? cashier.getName() : donation.getCreatedBy();
            } catch (Exception ignored) {
                cashierName = donation.getCreatedBy();
            }
            y = ReceiptPdfUtil.drawWrapped(g, (en ? "Received by: " : "प्राप्तकर्ता: ") + cashierName,
                    M, y, CONTENT_W, fNormal, frc, LINE_H);

            if (y > H - FOOTER_CLEARANCE) {
                throw new IllegalStateException(
                        "UPI donation receipt content overflowed available space (y=" + y
                                + ", limit=" + (H - FOOTER_CLEARANCE) + ") — reduce content or spacing");
            }

            g.dispose();

            return ReceiptPdfUtil.imageToA5Pdf(img);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate UPI donation receipt PDF", e);
        }
    }
}
