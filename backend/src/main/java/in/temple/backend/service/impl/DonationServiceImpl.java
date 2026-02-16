package in.temple.backend.service.impl;

import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import in.temple.backend.dto.*;
import in.temple.backend.model.*;
import in.temple.backend.repository.*;
import in.temple.backend.service.DonationService;
import in.temple.backend.service.ReceiptService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

// iText PDF
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.font.PdfEncodings;

import com.itextpdf.layout.element.Image;
import com.itextpdf.io.image.ImageDataFactory;

//import com.itextpdf.layout.property.TextAlignment;
//import com.itextpdf.layout.property.UnitValue;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;



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

    @Override
    @Transactional
    public byte[] createDonationAndReturnReceiptPdf(
            DonationRequestDto req,
            String username) {

        // Step 1: Save donation (sequence consumed here)
        DonationResponseDto response =
                createDonation(req, username);

        // Step 2: Fetch saved donation
        Donation donation = donationRepo.findById(response.getDonationId())
                .orElseThrow(() ->
                        new IllegalStateException("Donation not found"));

        // Step 3: Generate printable receipt
        return generateReceiptPdf(donation);
    }

    private byte[] generateReceiptPdf(Donation donation) {

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // ---------------- Load Hindi Font ----------------
            InputStream fontStream =
                    getClass().getResourceAsStream("/fonts/NotoSansDevanagari-Regular.ttf");

            PdfFont hindiFont = PdfFontFactory.createFont(
            );


            PdfFont englishFont = PdfFontFactory.createFont(
                    com.itextpdf.io.font.constants.StandardFonts.HELVETICA
            );

            // ---------------- Logo ----------------
            InputStream logoStream =
                    getClass().getResourceAsStream("/static/logo.png");

            if (logoStream != null) {
                byte[] logoBytes = logoStream.readAllBytes();
                Image logo = new Image(ImageDataFactory.create(logoBytes));
                logo.setWidth(80);
                logo.setAutoScale(true);
//                logo.setHorizontalAlignment(
//                        com.itextpdf.layout.property.HorizontalAlignment.CENTER
//                );
                document.add(logo);
            }

            // ---------------- Title ----------------
            document.add(
                    new Paragraph("श्री मंदिर दान रसीद")
                            .setFont(hindiFont)
                            .setFontSize(18)
                            .setBold()
                            .setTextAlignment(TextAlignment.CENTER)
            );

            document.add(
                    new Paragraph("Temple Donation Receipt")
                            .setFont(englishFont)
                            .setFontSize(14)
                            .setTextAlignment(TextAlignment.CENTER)
            );

            document.add(new Paragraph("\n"));

            // ---------------- Table Layout ----------------
            Table table = new Table(UnitValue.createPercentArray(new float[]{40, 60}))
                    .useAllAvailableWidth();

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

            addRow(table, "रसीद संख्या", donation.getReceiptNumber(), hindiFont, englishFont);
            addRow(table, "दिनांक", donation.getCreatedAt().format(formatter), hindiFont, englishFont);
            addRow(table, "नाम", donation.getDonorName(), hindiFont, englishFont);
            addRow(table, "मोबाइल", donation.getMobile(), hindiFont, englishFont);
            addRow(table, "दान उद्देश्य", donation.getPurposeNameHi(), hindiFont, englishFont);
            addRow(table, "राशि", "₹ " + donation.getAmount(), hindiFont, englishFont);

            if (donation.getGotraNameHi() != null) {
                addRow(table, "गोत्र", donation.getGotraNameHi(), hindiFont, englishFont);
            }

            document.add(table);

            document.add(new Paragraph("\n"));

            document.add(
                    new Paragraph("आपके सहयोग के लिए धन्यवाद 🙏")
                            .setFont(hindiFont)
                            .setFontSize(12)
                            .setTextAlignment(TextAlignment.CENTER)
            );

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate receipt PDF", e);
        }
    }

    private void addRow(Table table,
                        String label,
                        String value,
                        PdfFont hindiFont,
                        PdfFont englishFont) {

        table.addCell(
                new Cell().add(new Paragraph(label)
                        .setFont(hindiFont)
                        .setBold())
        );

        table.addCell(
                new Cell().add(new Paragraph(value != null ? value : "")
                        .setFont(englishFont))
        );
    }








}
