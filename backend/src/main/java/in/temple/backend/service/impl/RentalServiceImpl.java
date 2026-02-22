package in.temple.backend.service.impl;

import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import in.temple.backend.dto.RentalDetailsResponseDto;
import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;
import in.temple.backend.model.*;
import in.temple.backend.model.enums.RentalStatus;
import in.temple.backend.repository.*;
import in.temple.backend.service.RentalService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final RentalItemRepository rentalItemRepository;
    private final RentalReturnRepository rentalReturnRepository;
    private final DamagedInventoryRepository damagedInventoryRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public String issueRental(RentalIssueRequestDto request) {

        Long seq = ((Number) entityManager
                .createNativeQuery("SELECT nextval('rental_receipt_seq')")
                .getSingleResult()).longValue();

        String receipt = "RENT-" + Year.now().getValue() + "-" + String.format("%07d", seq);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (RentalIssueRequestDto.Item item : request.getItems()) {
            InventoryItem inv = entityManager.find(
                    InventoryItem.class,
                    item.getInventoryItemId(),
                    LockModeType.PESSIMISTIC_WRITE
            );

            // ✅ CATEGORY SAFETY CHECK (ADD THIS)
            if (!request.getCategory().name().equalsIgnoreCase(inv.getCategory())) {
                throw new RuntimeException(
                        "Inventory item category mismatch for item: " + inv.getMaterialNameHi()
                );
            }

            if (inv.getTotalStock() < item.getQuantity()) {
                throw new RuntimeException("Out of stock: " + inv.getMaterialNameHi());
            }

            inv.setTotalStock(inv.getTotalStock() - item.getQuantity());
            BigDecimal lineTotal =
                    inv.getRate().multiply(BigDecimal.valueOf(item.getQuantity()));

            calculatedTotal = calculatedTotal.add(lineTotal);
        }

        Rental rental = rentalRepository.save(
                Rental.builder()
                        .receiptNumber(receipt)
                        .category(request.getCategory())
                        .customerName(request.getCustomerName())
                        .mobile(request.getMobile())
                        .address(request.getAddress())
                        .aadhaar(request.getAadhaar())
                        .calculatedTotalAmount(calculatedTotal)
                        .chargedAmount(BigDecimal.valueOf(request.getChargedAmount()))
                        .depositAmount(BigDecimal.valueOf(request.getDepositAmount()))
                        .status(RentalStatus.ISSUED)
                        .createdBy(request.getCreatedBy())
                        .build()
        );

        for (RentalIssueRequestDto.Item item : request.getItems()) {
            InventoryItem inv = entityManager.find(InventoryItem.class, item.getInventoryItemId());

            rentalItemRepository.save(
                    RentalItem.builder()
                            .rentalId(rental.getId())
                            .inventoryItemId(inv.getId())
                            .itemNameSnapshot(inv.getMaterialNameHi())
                            .rateAtIssue(inv.getRate())
                            .issuedQty(item.getQuantity())
                            .returnedQty(0)
                            .damagedQty(0)
                            .missingQty(0)
                            .build()
            );
        }

        return receipt;
    }

    @Override
    @Transactional
    public void returnRental(RentalReturnRequestDto request) {

        Rental rental = rentalRepository.findByReceiptNumber(request.getReceiptNumber())
                .orElseThrow(() -> new RuntimeException("Invalid receipt"));

        if (rental.getStatus() == RentalStatus.CLOSED) {
            throw new RuntimeException("Rental already closed");
        }

        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());

        for (RentalReturnRequestDto.Item r : request.getItems()) {

            RentalItem ri = items.stream()
                    .filter(i -> i.getId().equals(r.getRentalItemId()))
                    .findFirst()
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Invalid rentalItemId " + r.getRentalItemId() +
                                            " for receipt " + request.getReceiptNumber()
                            )
                    );


            int remaining = ri.getIssuedQty()
                    - ri.getReturnedQty()
                    - ri.getDamagedQty()
                    - ri.getMissingQty();

            int delta = r.getReturnedQty() + r.getDamagedQty() + r.getMissingQty();

            if (delta > remaining) {
                throw new RuntimeException("Invalid return quantity");
            }

            if (r.getReturnedQty() > 0) {
                InventoryItem inv = entityManager.find(
                        InventoryItem.class,
                        ri.getInventoryItemId(),
                        LockModeType.PESSIMISTIC_WRITE
                );
                inv.setTotalStock(inv.getTotalStock() + r.getReturnedQty());
            }

            ri.setReturnedQty(ri.getReturnedQty() + r.getReturnedQty());
            ri.setDamagedQty(ri.getDamagedQty() + r.getDamagedQty());
            ri.setMissingQty(ri.getMissingQty() + r.getMissingQty());
        }

        if (request.getFineAmount() != null) {
            rental.setTotalFineAmount(
                    rental.getTotalFineAmount()
                            .add(BigDecimal.valueOf(request.getFineAmount()))
            );
        }

        rentalReturnRepository.save(
                RentalReturn.builder()
                        .rentalId(rental.getId())
                        .fineAmount(request.getFineAmount())
                        .remarks(request.getRemarks())
                        .createdBy(request.getHandledBy())
                        .build()
        );

        boolean completed = items.stream().allMatch(i ->
                i.getIssuedQty().equals(
                        i.getReturnedQty() + i.getDamagedQty() + i.getMissingQty()
                )
        );

        rental.setStatus(completed ? RentalStatus.CLOSED : RentalStatus.PARTIALLY_RETURNED);
    }

    @Override
    @Transactional(readOnly = true)
    public RentalDetailsResponseDto getRentalByReceipt(String receiptNumber) {

        Rental rental = rentalRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new RuntimeException("Invalid receipt number"));

        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());

        RentalDetailsResponseDto dto = new RentalDetailsResponseDto();
        dto.setReceiptNumber(rental.getReceiptNumber());
        dto.setCustomerName(rental.getCustomerName());
        dto.setMobile(rental.getMobile());
        dto.setAddress(rental.getAddress());
        dto.setDepositAmount(rental.getDepositAmount());
        dto.setTotalFineAmount(rental.getTotalFineAmount());
        dto.setStatus(rental.getStatus().name());

        dto.setItems(
                items.stream().map(i -> {
                    RentalDetailsResponseDto.Item it = new RentalDetailsResponseDto.Item();
                    it.setRentalItemId(i.getId());
                    it.setItemName(i.getItemNameSnapshot());
                    it.setRate(i.getRateAtIssue());
                    it.setIssuedQty(i.getIssuedQty());
                    it.setReturnedQty(i.getReturnedQty());
                    it.setDamagedQty(i.getDamagedQty());
                    it.setMissingQty(i.getMissingQty());

                    int remaining =
                            i.getIssuedQty()
                                    - i.getReturnedQty()
                                    - i.getDamagedQty()
                                    - i.getMissingQty();

                    it.setRemainingQty(remaining);
                    return it;
                }).toList()
        );

        return dto;
    }

    @Override
    @Transactional
    public byte[] createRentalAndReturnReceiptPdf(
            RentalIssueRequestDto request,
            String username
    ) {

        request.setCreatedBy(username);

        // 1️⃣ Save rental
        String receiptNumber = issueRental(request);

        // 2️⃣ Fetch saved rental
        Rental rental = rentalRepository
                .findByReceiptNumber(receiptNumber)
                .orElseThrow(() ->
                        new IllegalStateException("Rental not found"));

        List<RentalItem> items =
                rentalItemRepository.findByRentalId(rental.getId());

        // 3️⃣ Generate PDF
        return generateRentalReceiptPdf(rental, items);
    }

    private byte[] generateRentalReceiptPdf(
            Rental rental,
            List<RentalItem> items
    ) {

        try {

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(
                            com.lowagie.text.PageSize.A5,
                            40, 40, 60, 40
                    );

            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();

            // 🔥 Unicode Font (Hindi Support)
            com.lowagie.text.pdf.BaseFont baseFont =
                    com.lowagie.text.pdf.BaseFont.createFont(
                            "fonts/NotoSansDevanagari-Regular.ttf",
                            com.lowagie.text.pdf.BaseFont.IDENTITY_H,
                            com.lowagie.text.pdf.BaseFont.EMBEDDED
                    );

            Font normal = new Font(baseFont, 11);
            Font bold = new Font(baseFont, 12, Font.BOLD);

            java.time.format.DateTimeFormatter formatter =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");

            document.add(new com.lowagie.text.Paragraph("\n\n", normal));

            // ===== Title =====
            com.lowagie.text.Paragraph title =
                    new com.lowagie.text.Paragraph("RENTAL RECEIPT", bold);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new com.lowagie.text.Paragraph("\n", normal));

            // ===== Receipt No + Date (Same Line) =====
            com.lowagie.text.pdf.PdfPTable headerTable =
                    new com.lowagie.text.pdf.PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1f, 1f});

            headerTable.addCell(getBorderlessCell(
                    "Receipt No: " + rental.getReceiptNumber(),
                    normal));

            headerTable.addCell(getRightBorderlessCell(
                    "Date: " + rental.getCreatedAt().format(formatter),
                    normal));

            document.add(headerTable);

            document.add(new com.lowagie.text.Paragraph("\n", normal));

            // ===== Name + Mobile (Same Line) =====
            com.lowagie.text.pdf.PdfPTable customerTable =
                    new com.lowagie.text.pdf.PdfPTable(2);
            customerTable.setWidthPercentage(100);
            customerTable.setWidths(new float[]{1f, 1f});

            customerTable.addCell(getBorderlessCell(
                    "Customer: " + rental.getCustomerName(),
                    normal));

            customerTable.addCell(getRightBorderlessCell(
                    "Mobile: " + rental.getMobile(),
                    normal));

            document.add(customerTable);

            document.add(new com.lowagie.text.Paragraph(
                    "Address: " + rental.getAddress(),
                    normal));

            document.add(new com.lowagie.text.Paragraph("\n", normal));

            // ===== Items Table =====
            com.lowagie.text.pdf.PdfPTable table =
                    new com.lowagie.text.pdf.PdfPTable(3);

            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 1f, 1f});

            table.addCell(getBoldCell("Item", bold));
            table.addCell(getBoldCell("Qty", bold));
            table.addCell(getBoldCell("Rate", bold));

            for (RentalItem item : items) {
                table.addCell(getNormalCell(
                        item.getItemNameSnapshot(), normal));
                table.addCell(getCenterCell(
                        String.valueOf(item.getIssuedQty()), normal));
                table.addCell(getRightCell(
                        "₹ " + item.getRateAtIssue(), normal));
            }

            document.add(table);

            document.add(new com.lowagie.text.Paragraph("\n", normal));

            document.add(new com.lowagie.text.Paragraph(
                    "Deposit: ₹ " + rental.getDepositAmount(),
                    normal));

            document.add(new com.lowagie.text.Paragraph(
                    "Charged Amount: ₹ " + rental.getChargedAmount(),
                    normal));

            document.add(new com.lowagie.text.Paragraph("\n\n", normal));

            document.add(new com.lowagie.text.Paragraph(
                    "Authorized Signatory",
                    normal));

            document.add(new com.lowagie.text.Paragraph(
                    "For Chamatkarik Shree Hanuman Mandir Sansthan",
                    normal));

            document.close();

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate rental receipt", e);
        }
    }

    private PdfPCell getBoldCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        return cell;
    }

    private PdfPCell getNormalCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        return cell;
    }

    private PdfPCell getCenterCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell getRightCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }
    private PdfPCell getBorderlessCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        return cell;
    }

    private PdfPCell getRightBorderlessCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

}
