package in.temple.backend.service.impl;


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
    private byte[] generateReceiptPdf(Donation donation) {

    try {

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        com.lowagie.text.Document document =
                new com.lowagie.text.Document(
                        com.lowagie.text.PageSize.A5,
                        40, 40, 60, 40
                );

        com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
        document.open();

        // Fonts
        com.lowagie.text.Font normal =
                new com.lowagie.text.Font(
                        com.lowagie.text.Font.HELVETICA, 12);

        com.lowagie.text.Font bold =
                new com.lowagie.text.Font(
                        com.lowagie.text.Font.HELVETICA, 12,
                        com.lowagie.text.Font.BOLD);

        com.lowagie.text.Font titleFont =
                new com.lowagie.text.Font(
                        com.lowagie.text.Font.HELVETICA, 14,
                        com.lowagie.text.Font.BOLD);

        java.time.format.DateTimeFormatter formatter =
                java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");

        String formattedAmount = String.format("%,.0f", donation.getAmount());

        // Top gap for pre-printed header
        document.add(new com.lowagie.text.Paragraph("\n\n\n\n", normal));

        // Title
        com.lowagie.text.Paragraph title =
                new com.lowagie.text.Paragraph("DONATION-RECEIPT", titleFont);
        title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        document.add(title);

        document.add(new com.lowagie.text.Paragraph("\n", normal));

        // Receipt No & Date table
        com.lowagie.text.pdf.PdfPTable headerTable =
                new com.lowagie.text.pdf.PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new int[]{1, 1});

        headerTable.addCell(getBorderlessCell(
                "Receipt No: " + donation.getReceiptNumber(), normal));

        headerTable.addCell(getRightAlignedCell(
                "Date: " + donation.getCreatedAt().format(formatter), normal));

        document.add(headerTable);

        document.add(new com.lowagie.text.Paragraph("\n\n", normal));

        // Body
        document.add(new com.lowagie.text.Paragraph(
                "Received with sincere thanks from:", normal));

//        document.add(new com.lowagie.text.Paragraph("\n", normal));

        document.add(new com.lowagie.text.Paragraph(
                donation.getDonorName(), bold));

        document.add(new com.lowagie.text.Paragraph("\n", normal));

//        document.add(new com.lowagie.text.Paragraph("Address:", normal));

        document.add(new com.lowagie.text.Paragraph(
                donation.getAddress() != null ? "Address: " + donation.getAddress() : "",
                normal));

//        document.add(new com.lowagie.text.Paragraph("\n", normal));

        document.add(new com.lowagie.text.Paragraph(
                "Mobile: " + donation.getMobile(), normal));

        // document.add(new com.lowagie.text.Paragraph("\n", normal));

        document.add(new com.lowagie.text.Paragraph(
                "A donation of Rs. " + formattedAmount + "/- has been received towards:" ,
                normal));

//        document.add(new com.lowagie.text.Paragraph(
//                "has been received towards:",
//                normal));
//
//        document.add(new com.lowagie.text.Paragraph("\n", normal));

        document.add(new com.lowagie.text.Paragraph(
                donation.getPurposeNameEn().toUpperCase(),
                bold));

//        document.add(new com.lowagie.text.Paragraph("\n\n", normal));




//        document.add(new com.lowagie.text.Paragraph(
//                "development of the temple.",
//                normal));

        document.add(new com.lowagie.text.Paragraph("\n\n", normal));
        document.add(new com.lowagie.text.Paragraph(
                "Authorized Signatory",
                normal));
        document.add(new com.lowagie.text.Paragraph("\n\n", normal));

        document.add(new com.lowagie.text.Paragraph(
                "For Chamatkarik Shree Hanuman Mandir Sansthan",
                normal));

        document.add(new com.lowagie.text.Paragraph(
                "(Hanuman Lok), Jamsawli",
                normal));

//        document.add(new com.lowagie.text.Paragraph("\n\n", normal));
//
//
//
//        document.add(new com.lowagie.text.Paragraph(
//                "Your support plays a vital role in the continued service and development of the temple.",
//                normal));

        document.close();

        return out.toByteArray();

    } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException("Failed to generate receipt PDF", e);
    }
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
    public byte[] generateReceiptPdfById(Long id) {
        Donation donation = donationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        return generateReceiptPdf(donation); // you already have this method
    }

    private DonationListItemDto convertToListItemDto(Donation donation) {

        return DonationListItemDto.builder()
                .id(donation.getId())
                .receiptNumber(donation.getReceiptNumber())
                .donorName(donation.getDonorName())
                .mobile(donation.getMobile())
                .purposeNameEn(donation.getPurposeNameEn())
                .purposeNameHi(donation.getPurposeNameHi())
                .amount(donation.getAmount())
                .createdAt(donation.getCreatedAt())
                .build();
    }

    @Override
    public Donation getDonationById(Long id) {
        return donationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found"));
    }

}
