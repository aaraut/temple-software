package in.temple.backend.service.impl;


import in.temple.backend.dto.*;
import in.temple.backend.model.*;
import in.temple.backend.repository.*;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.DonationService;
import in.temple.backend.service.ReceiptService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;




import java.io.InputStream;
import java.time.format.DateTimeFormatter;


// Java IO
import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class DonationServiceImpl implements DonationService {

    private static final Pattern MOBILE_PATTERN =
            Pattern.compile("^[0-9]{10}$");

    private final DonationPurposeRepository purposeRepo;
    private final DonationRepository donationRepo;
    private final ReceiptService receiptService;
    private final GotraRepository gotraRepository;

    private final DonationAuditRepository donationAuditRepo;
    private final AuthContextService authContextService;


    // =================================================
    // FORM METADATA
    // =================================================

    @Override
    @Transactional(readOnly = true)
    public DonationFormMetadataDto getFormMetadata() {

        DonationFormMetadataDto dto = new DonationFormMetadataDto();
        dto.setLanguages(List.of("hi", "en"));
        dto.setPaymentTypes(List.of("CASH"));

        dto.setPurposes(
                purposeRepo.findByActiveTrue().stream().map(p -> {
                    DonationFormMetadataDto.PurposeDto d =
                            new DonationFormMetadataDto.PurposeDto();
                    d.setId(p.getId());
                    d.setNameEn(p.getNameEn());
                    d.setNameHi(p.getNameHi());
                    d.setFixedAmount(p.getFixedAmount());
                    d.setRequiresGotra(p.isRequiresGotra());
                    return d;
                }).toList()
        );

        dto.setGotras(
                gotraRepository.findAll().stream().map(g -> {
                    DonationFormMetadataDto.GotraDto d =
                            new DonationFormMetadataDto.GotraDto();
                    d.setId(g.getId());
                    d.setNameEn(g.getEnglishName());
                    d.setNameHi(g.getHindiName());
                    d.setDefault("Kashyap".equalsIgnoreCase(g.getId()));
                    return d;
                }).toList()
        );

        return dto;
    }

    // =================================================
    // CREATE DONATION
    // =================================================

    @Override
    @Transactional
    public DonationResponseDto createDonation(
            DonationRequestDto req,
            String username) {

        validateMobile(req.getMobile());

        DonationPurpose purpose = purposeRepo.findById(req.getPurposeId())
                .orElseThrow(() ->
                        new IllegalStateException("Invalid donation purpose"));

        if (!purpose.isActive()) {
            throw new IllegalStateException("Purpose is disabled");
        }

        validateGotra(purpose, req.getGotraId());

        // ✅ FIX: validate, do NOT override
        validateAmount(purpose, req.getAmount());

        String receiptNumber =
                receiptService.consumeReceiptNumber(
                        purpose.getReceiptPrefix(),
                        username
                );

        Donation donation = Donation.builder()
                .receiptNumber(receiptNumber)
                .donorName(req.getDonorName())
                .address(req.getAddress())
                .mobile(req.getMobile())
                .purposeId(purpose.getId())
                .purposeNameEn(purpose.getNameEn())
                .purposeNameHi(purpose.getNameHi())
                .amount(req.getAmount()) // ✅ USE USER INPUT
                .paymentType("CASH")
                .createdAt(LocalDateTime.now())
                .createdBy(username)
                .active(true)
                .build();

        if (purpose.isRequiresGotra()) {
            Gotra g = gotraRepository.findById(req.getGotraId())
                    .orElseThrow(() ->
                            new IllegalStateException("Invalid gotra"));

            donation.setGotraId(g.getId());
            donation.setGotraNameEn(g.getEnglishName());
            donation.setGotraNameHi(g.getHindiName());
        }

        Donation saved = donationRepo.save(donation);

        saveAudit(
                saved.getId(),
                "CREATE",
                null,
                saved.toString(), // simple version for now
                username
        );

        return new DonationResponseDto(
                saved.getId(),
                saved.getReceiptNumber(),
                "SUCCESS");

    }

    // =================================================
    // UPDATE DONATION
    // =================================================

    @Override
    @Transactional
    public DonationResponseDto updateDonation(
            Long donationId,
            DonationUpdateRequestDto req,
            String username) {

        validateMobile(req.getMobile());

        Donation donation = donationRepo.findById(donationId)
                .orElseThrow(() ->
                        new IllegalStateException("Donation not found"));

        DonationPurpose newPurpose = purposeRepo.findById(req.getPurposeId())
                .orElseThrow(() ->
                        new IllegalStateException("Invalid donation purpose"));

        if (!newPurpose.isActive()) {
            throw new IllegalStateException("Purpose is disabled");
        }

        validateGotra(newPurpose, req.getGotraId());

        String oldData = donation.toString();


        // ✅ FIX: validate, do NOT override
        validateAmount(newPurpose, req.getAmount());

        donation.setDonorName(req.getDonorName());
        donation.setAddress(req.getAddress());
        donation.setMobile(req.getMobile());

        donation.setPurposeId(newPurpose.getId());
        donation.setPurposeNameEn(newPurpose.getNameEn());
        donation.setPurposeNameHi(newPurpose.getNameHi());

        donation.setAmount(req.getAmount()); // ✅ USE USER INPUT

        if (newPurpose.isRequiresGotra()) {
            Gotra g = gotraRepository.findById(req.getGotraId())
                    .orElseThrow(() ->
                            new IllegalStateException("Invalid gotra"));

            donation.setGotraId(g.getId());
            donation.setGotraNameEn(g.getEnglishName());
            donation.setGotraNameHi(g.getHindiName());
        } else {
            donation.setGotraId(null);
            donation.setGotraNameEn(null);
            donation.setGotraNameHi(null);
        }

        Donation saved = donationRepo.save(donation);

        saveAudit(
                saved.getId(),
                "UPDATE",
                oldData,
                saved.toString(),
                username
        );

        return new DonationResponseDto(
                saved.getId(),
                saved.getReceiptNumber(),
                "UPDATED");

    }

    // =================================================
    // VALIDATIONS
    // =================================================

    private void validateAmount(
            DonationPurpose purpose,
            BigDecimal amount) {

        if (purpose.getFixedAmount() != null) {
            if (amount == null ||
                    amount.compareTo(purpose.getFixedAmount()) != 0) {

                throw new IllegalStateException(
                        "Invalid amount. Fixed amount for this purpose is ₹"
                                + purpose.getFixedAmount()
                );
            }
        } else {
            if (amount == null || amount.signum() <= 0) {
                throw new IllegalStateException("Invalid donation amount");
            }
        }
    }

    private void validateGotra(
            DonationPurpose purpose,
            String gotraId) {

        if (purpose.isRequiresGotra()) {
            if (gotraId == null || gotraId.isBlank()) {
                throw new IllegalStateException("Gotra is required");
            }
        }
    }

    private void validateMobile(String mobile) {
        if (mobile == null || !MOBILE_PATTERN.matcher(mobile).matches()) {
            throw new IllegalStateException("Invalid mobile number");
        }
    }

    private void saveAudit(
            Long donationId,
            String action,
            String oldData,
            String newData,
            String username) {

        DonationAudit audit = DonationAudit.builder()
                .donationId(donationId)
                .action(action)
                .oldData(oldData)
                .newData(newData)
                .performedBy(username)
                .performedAt(LocalDateTime.now())
                .build();

        donationAuditRepo.save(audit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DonationListItemDto> searchActiveDonations(
            DonationSearchRequestDto req) {

        if (req.getMobile() != null && !req.getMobile().isBlank()) {
            return donationRepo
                    .findByActiveTrueAndMobileContainingIgnoreCaseOrderByCreatedAtDesc(
                            req.getMobile()
                    )
                    .stream()
                    .map(this::convertToListItemDto)
                    .toList();
        }

        if (req.getDonorName() != null && !req.getDonorName().isBlank()) {
            return donationRepo
                    .findByActiveTrueAndDonorNameContainingIgnoreCaseOrderByCreatedAtDesc(
                            req.getDonorName()
                    )
                    .stream()
                    .map(this::convertToListItemDto)
                    .toList();
        }

        if (req.getPurposeNameEn() != null
                && req.getFromDate() != null
                && req.getToDate() != null) {

            LocalDateTime start = req.getFromDate().atStartOfDay();
            LocalDateTime end = req.getToDate().atTime(23, 59, 59);

            List<Donation> donations;

            if (req.getCreatedBy() != null
                    && !req.getCreatedBy().equalsIgnoreCase("ALL")) {

                donations = donationRepo
                        .findByActiveTrueAndPurposeNameEnAndCreatedAtBetweenAndCreatedByOrderByCreatedAtDesc(
                                req.getPurposeNameEn(),
                                start,
                                end,
                                req.getCreatedBy()
                        );
            } else {

                donations = donationRepo
                        .findByActiveTrueAndPurposeNameEnAndCreatedAtBetweenOrderByCreatedAtDesc(
                                req.getPurposeNameEn(),
                                start,
                                end
                        );
            }

            return donations.stream()
                    .map(this::convertToListItemDto)
                    .toList();
        }

        var from =
                req.getFromDate() != null
                        ? req.getFromDate().atStartOfDay()
                        : null;

        var to =
                req.getToDate() != null
                        ? req.getToDate().atTime(23, 59, 59)
                        : null;

        List<Donation> donations;

        if (req.getReceiptNumber() != null
                && req.getMobile() != null
                && from != null
                && to != null) {

            donations =
                    donationRepo
                            .findByActiveTrueAndReceiptNumberAndMobileAndCreatedAtBetweenOrderByCreatedAtDesc(
                                    req.getReceiptNumber(),
                                    req.getMobile(),
                                    from,
                                    to
                            );

        } else if (req.getReceiptNumber() != null) {

            donations =
                    donationRepo
                            .findByActiveTrueAndReceiptNumberOrderByCreatedAtDesc(
                                    req.getReceiptNumber()
                            );

        } else if (req.getMobile() != null) {

            donations =
                    donationRepo
                            .findByActiveTrueAndMobileOrderByCreatedAtDesc(
                                    req.getMobile()
                            );

        } else if (from != null && to != null) {

            donations =
                    donationRepo
                            .findByActiveTrueAndCreatedAtBetweenOrderByCreatedAtDesc(
                                    from,
                                    to
                            );

        } else {

            donations =
                    donationRepo.findByActiveTrueOrderByCreatedAtDesc();
        }

        return donations.stream()
                .map(this::mapToListDto)
                .toList();
    }


    private DonationListItemDto mapToListDto(Donation d) {
        DonationListItemDto dto = new DonationListItemDto();
        dto.setId(d.getId());
        dto.setReceiptNumber(d.getReceiptNumber());
        dto.setDonorName(d.getDonorName());
        dto.setMobile(d.getMobile());
        dto.setPurposeNameEn(d.getPurposeNameEn());
        dto.setPurposeNameHi(d.getPurposeNameHi());
        dto.setAmount(d.getAmount());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setGotraId(d.getGotraId());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DonationListItemDto> searchInactiveDonations(
            DonationSearchRequestDto req) {

        var from =
                req.getFromDate() != null
                        ? req.getFromDate().atStartOfDay()
                        : null;

        var to =
                req.getToDate() != null
                        ? req.getToDate().atTime(23, 59, 59)
                        : null;

        List<Donation> donations;

        if (req.getReceiptNumber() != null) {

            donations =
                    donationRepo
                            .findByActiveFalseAndReceiptNumberOrderByCreatedAtDesc(
                                    req.getReceiptNumber()
                            );

        } else if (req.getMobile() != null) {

            donations =
                    donationRepo
                            .findByActiveFalseAndMobileOrderByCreatedAtDesc(
                                    req.getMobile()
                            );

        } else if (from != null && to != null) {

            donations =
                    donationRepo
                            .findByActiveFalseAndCreatedAtBetweenOrderByCreatedAtDesc(
                                    from,
                                    to
                            );

        } else {

            donations =
                    donationRepo.findByActiveFalseOrderByCreatedAtDesc();
        }

        return donations.stream()
                .map(this::mapToListDto)
                .toList();
    }
    @Override
    @Transactional
    public void changeDonationStatus(
            Long donationId,
            boolean active,
            String username) {

        Donation donation = donationRepo.findById(donationId)
                .orElseThrow(() ->
                        new IllegalStateException("Donation not found"));

        // No-op if status is same
        if (Boolean.TRUE.equals(donation.getActive()) == active) {
            return;
        }

        String oldData = donation.toString();

        donation.setActive(active);
        Donation saved = donationRepo.save(donation);

        saveAudit(
                saved.getId(),
                active ? "ENABLE" : "DISABLE",
                oldData,
                saved.toString(),
                username
        );
    }
    // install on ubuntu sudo apt install chromium-browser
    private byte[] generateReceiptPdf(Donation donation, String language) {

        boolean en = "en".equalsIgnoreCase(language);

        try {

            // ── 1. Build receipt values ───────────────────────────────────────────
            java.time.format.DateTimeFormatter formatter =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");

            String formattedAmount = String.format("%,.0f", donation.getAmount());
            String amountInWords   = en
                    ? in.temple.backend.util.HindiNumberUtil.convertEnglish(donation.getAmount())
                    : in.temple.backend.util.HindiNumberUtil.convert(donation.getAmount());
            String purposeText     = en
                    ? (donation.getPurposeNameEn() != null ? donation.getPurposeNameEn() : donation.getPurposeNameHi())
                    : (donation.getPurposeNameHi() != null ? donation.getPurposeNameHi() : donation.getPurposeNameEn());
            // Donors who don't type an address keep the frontend's default
            // "Nagpur / Chhindwara" (always stored in English, per the form's
            // design). Translate that one known default for the Hindi receipt —
            // any other (donor-typed) address is free text and can't be
            // auto-translated, so it prints exactly as entered.
            String rawAddress      = donation.getAddress() != null ? donation.getAddress() : "";
            String address         = (!en && "Nagpur / Chhindwara".equalsIgnoreCase(rawAddress.trim()))
                    ? "नागपुर / छिंदवाड़ा"
                    : rawAddress;

            // Gotra — only present for Abhishek-type purposes
            String gotra = en
                    ? ((donation.getGotraNameEn() != null && !donation.getGotraNameEn().isBlank())
                        ? donation.getGotraNameEn()
                        : (donation.getGotraNameHi() != null ? donation.getGotraNameHi() : ""))
                    : ((donation.getGotraNameHi() != null && !donation.getGotraNameHi().isBlank())
                        ? donation.getGotraNameHi() : "");

            // Cashier name from the user who created this donation
            String cashierName = "";
            try {
                User cashier = authContextService.getLoggedInUser(donation.getCreatedBy());
                if (cashier.getName() != null && !cashier.getName().isBlank()) {
                    cashierName = cashier.getName();
                }
            } catch (Exception ignored) {
                cashierName = donation.getCreatedBy(); // fallback to username
            }

            // ── 2. Load NotoSansDevanagari font ───────────────────────────────────
            // Java AWT's TextLayout uses the JVM's built-in HarfBuzz shaper which
            // correctly shapes Devanagari conjuncts and matras. OpenPDF/openhtmltopdf
            // do NOT do this shaping, which is why Hindi text appeared scrambled.
            InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf");
            if (fontStream == null)
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found in resources/fonts/");

            java.awt.Font baseFont = java.awt.Font.createFont(
                    java.awt.Font.TRUETYPE_FONT, fontStream);
            fontStream.close();

            // ── 3. Coordinate system ──────────────────────────────────────────────
            // A5 = 420 × 595 pt. We render at SCALE=2 giving 840 × 1190 px.
            // All layout values are in POINTS; multiply by SCALE for actual pixels.
            // IMPORTANT: deriveFont(float) sets SIZE in points.
            //            deriveFont(int)   sets STYLE (bold/italic) — DO NOT use for size.
            // SCALE=3 → ~216 DPI equivalent; kept above 2 so printers with
            // real 300+ DPI don't have to upscale a soft/blurry source bitmap.
            final int SCALE  = 3;
            final int W      = 420 * SCALE;   // 840 px
            final int H      = 595 * SCALE;   // 1190 px
            final int M      = 46  * SCALE;   // 46 pt margin — extra buffer vs. printer/paper clipping
            final int LINE_H = 22  * SCALE;   // 22 pt line height

            // Paper is pre-printed letterhead stock (temple logo/shloka/name/address/
            // contact + a horizontal rule under the header). Our content must start
            // below that rule and stay clear of any pre-printed footer.
            // NOTE: 172pt is an estimate based on a sample printout — retest and
            // adjust this one constant if the heading still overlaps the letterhead.
            final int HEADER_CLEARANCE = 172 * SCALE;
            final int FOOTER_CLEARANCE = 20  * SCALE;

            java.awt.Font fNormal = baseFont.deriveFont(12.0f * SCALE);
            java.awt.Font fBold   = baseFont.deriveFont(java.awt.Font.BOLD, 13.0f * SCALE);
            java.awt.Font fTitle  = baseFont.deriveFont(java.awt.Font.BOLD, 16.0f * SCALE);

            // ── 4. Render onto BufferedImage ──────────────────────────────────────
            java.awt.image.BufferedImage img =
                    new java.awt.image.BufferedImage(W, H,
                            java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g = img.createGraphics();

            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, W, H);
            g.setColor(java.awt.Color.BLACK);
            g.setRenderingHint(java.awt.RenderingHints.KEY_TEXT_ANTIALIASING,
                    java.awt.RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(java.awt.RenderingHints.KEY_FRACTIONALMETRICS,
                    java.awt.RenderingHints.VALUE_FRACTIONALMETRICS_ON);

            java.awt.font.FontRenderContext frc = g.getFontRenderContext();

            // Content width available between the left/right margins — anything
            // wider than this must wrap, otherwise Graphics2D silently clips it
            // at the bitmap edge and the printed receipt shows cut-off text.
            final int CONTENT_W = W - 2 * M;

            // Two consistent spacing units used throughout — every gap in this
            // layout is one of these two, so vertical rhythm stays even instead
            // of a mix of ad hoc numbers.
            final int FIELD_GAP = 8  * SCALE;   // between one field and the next
            final int GROUP_GAP = 16 * SCALE;   // around section dividers

            // ── Heading — starts right below the pre-printed header's rule ────────
            int y = HEADER_CLEARANCE;
            String title = en ? "Donation Receipt" : "दान रसीद";
            java.awt.font.TextLayout titleLayout =
                    new java.awt.font.TextLayout(title, fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 3 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.2f * SCALE));
            g.drawLine(titleX - 6 * SCALE, titleBottom, titleX + titleW + 6 * SCALE, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 20 * SCALE;

            // Receipt number (left) & date (right) — same baseline
            drawLine(g, (en ? "Receipt No: " : "रसीद क्रमांक: ") + donation.getReceiptNumber(), M, y, fBold, frc);
            String dateStr = (en ? "Date: " : "दिनांक: ") + donation.getCreatedAt().format(formatter);
            java.awt.font.TextLayout dateLayout = new java.awt.font.TextLayout(dateStr, fBold, frc);
            drawLine(g, dateStr, (int) (W - M - dateLayout.getBounds().getWidth()), y, fBold, frc);
            y += LINE_H + FIELD_GAP;

            g.setStroke(new java.awt.BasicStroke(0.75f * SCALE));
            g.setColor(new java.awt.Color(150, 150, 150));
            g.drawLine(M, y, W - M, y);
            g.setColor(java.awt.Color.BLACK);
            y += GROUP_GAP;

            // Donor name — plain "label: value" field, consistent with every
            // field below it (was previously a "Received with thanks from..."
            // sentence; changed to a structured Name field per requirement).
            String nameLine = en
                    ? "Name: Shree/Smt " + donation.getDonorName()
                    : "नाम: श्री/श्रीमती " + donation.getDonorName();
            y = drawWrapped(g, nameLine, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;

            // Address & mobile — each is a single "label: value" line, wrapping
            // independently, same pattern as every other field below.
            y = drawWrapped(g, (en ? "Address: " : "पता: ") + address, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;
            y = drawWrapped(g, (en ? "Mobile: " : "मोबाइल: ") + donation.getMobile(), M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += FIELD_GAP;

            // Gotra — only when present
            if (!gotra.isEmpty()) {
                y = drawWrapped(g, (en ? "Gotra: " : "गोत्र: ") + gotra, M, y, CONTENT_W, fNormal, frc, LINE_H);
                y += FIELD_GAP;
            }

            // Amount line — bold; wraps if the amount-in-words runs long
            // (English number words are noticeably longer than Hindi ones)
            String amountLine = en
                    ? "Amount: Rs. " + formattedAmount + "/- (" + amountInWords + ") Cash"
                    : "राशि: ₹ " + formattedAmount + " /- (" + amountInWords + ") नगद";
            y = drawWrapped(g, amountLine, M, y, CONTENT_W, fBold, frc, LINE_H);
            y += FIELD_GAP;

            // Purpose — one "label: value" line like every field above it,
            // instead of a separate label line followed by the value.
            String purposeLine = en
                    ? "For: " + purposeText + " Donation"
                    : "उद्देश्य: " + purposeText + " हेतु दान राशि";
            y = drawWrapped(g, purposeLine, M, y, CONTENT_W, fNormal, frc, LINE_H);
            y += GROUP_GAP - FIELD_GAP;

            g.setStroke(new java.awt.BasicStroke(0.75f * SCALE));
            g.setColor(new java.awt.Color(150, 150, 150));
            g.drawLine(M, y, W - M, y);
            g.setColor(java.awt.Color.BLACK);
            y += GROUP_GAP;

            // Signatory — only the variable field (who processed it); the org
            // name/address is already on the pre-printed letterhead, so it is
            // not repeated here. Kept as one line, consistent with the fields above.
            y = drawWrapped(g, (en ? "Received by: " : "प्राप्तकर्ता: ") + cashierName, M, y, CONTENT_W, fNormal, frc, LINE_H);

            // Safety check — if a future field addition pushes content past the
            // reserved footer clearance, this fails loudly instead of silently
            // printing off the bottom edge of the page.
            if (y > H - FOOTER_CLEARANCE) {
                throw new IllegalStateException(
                        "Donation receipt content overflowed available space (y=" + y
                                + ", limit=" + (H - FOOTER_CLEARANCE) + ") — reduce content or spacing");
            }

            g.dispose();

            // ── 5. Encode BufferedImage → PNG (lossless — JPEG's compression
            // artifacts show up as visible ringing/haloing around text edges) ──
            ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "png", imgOut);

            // ── 6. Embed JPEG in A5 PDF via OpenPDF ──────────────────────────────
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(
                            com.lowagie.text.PageSize.A5,
                            0, 0, 0, 0
                    );

            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();

            com.lowagie.text.Image pdfImg =
                    com.lowagie.text.Image.getInstance(imgOut.toByteArray());
            pdfImg.scaleToFit(com.lowagie.text.PageSize.A5.getWidth(),
                    com.lowagie.text.PageSize.A5.getHeight());
            pdfImg.setAbsolutePosition(0, 0);
            document.add(pdfImg);
            document.close();

            return out.toByteArray();

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate receipt PDF", e);
        }
    }

    /** Draw text via TextLayout — applies HarfBuzz shaping for correct Devanagari. */
    private static void drawLine(java.awt.Graphics2D g, String text, int x, int y,
                                 java.awt.Font font,
                                 java.awt.font.FontRenderContext frc) {
        if (text == null || text.isEmpty()) return;
        new java.awt.font.TextLayout(text, font, frc).draw(g, x, y);
    }

    /**
     * Draw text wrapped at word boundaries to fit maxWidth, instead of running
     * past the bitmap edge and getting silently clipped (the cause of the
     * "content cut off" print issue). Returns the y position ready for the
     * next line after the wrapped block.
     */
    private static int drawWrapped(java.awt.Graphics2D g, String text, int x, int y, int maxWidth,
                                    java.awt.Font font,
                                    java.awt.font.FontRenderContext frc, int lineHeight) {
        if (text == null || text.isEmpty()) return y;

        java.text.AttributedString attrText = new java.text.AttributedString(text);
        attrText.addAttribute(java.awt.font.TextAttribute.FONT, font);
        java.awt.font.LineBreakMeasurer measurer =
                new java.awt.font.LineBreakMeasurer(attrText.getIterator(), frc);

        int curY = y;
        while (measurer.getPosition() < text.length()) {
            java.awt.font.TextLayout layout = measurer.nextLayout(maxWidth);
            layout.draw(g, x, curY);
            curY += lineHeight;
        }
        return curY;
    }


    @Override
    @Transactional
    public byte[] createDonationAndReturnReceiptPdf(
            DonationRequestDto req,
            String username,
            String language) {

        // Step 1: Save donation (sequence consumed here)
        DonationResponseDto response =
                createDonation(req, username);

        // Step 2: Fetch saved donation
        Donation donation = donationRepo.findById(response.getDonationId())
                .orElseThrow(() ->
                        new IllegalStateException("Donation not found"));

        // Step 3: Generate printable receipt
        return generateReceiptPdf(donation, language);
    }


    private com.lowagie.text.pdf.PdfPCell getBorderlessCell(String text,
                                                            com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell =
                new com.lowagie.text.pdf.PdfPCell(
                        new com.lowagie.text.Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        return cell;
    }

    private com.lowagie.text.pdf.PdfPCell getRightAlignedCell(String text,
                                                              com.lowagie.text.Font font) {
        com.lowagie.text.pdf.PdfPCell cell =
                new com.lowagie.text.pdf.PdfPCell(
                        new com.lowagie.text.Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
        return cell;
    }
    @Override
    public byte[] generateReceiptPdfById(Long id, String language) {
        Donation donation = donationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        return generateReceiptPdf(donation, language);
    }

    private DonationListItemDto convertToListItemDto(Donation donation) {

        return DonationListItemDto.builder()
                .id(donation.getId())
                .receiptNumber(donation.getReceiptNumber())
                .donorName(donation.getDonorName())
                .address(donation.getAddress())
                .mobile(donation.getMobile())
                .purposeNameEn(donation.getPurposeNameEn())
                .purposeNameHi(donation.getPurposeNameHi())
                .amount(donation.getAmount())
                .createdAt(donation.getCreatedAt())
                .gotraId(donation.getGotraId())
                .build();
    }

    @Override
    public Donation getDonationById(Long id) {
        return donationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
    }

}
