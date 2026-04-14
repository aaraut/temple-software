package in.temple.backend.service.impl;

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
        dto.setChargedAmount(rental.getChargedAmount());
        dto.setCalculatedTotalAmount(rental.getCalculatedTotalAmount());
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

    @Override
    @Transactional
    public byte[] returnRentalAndPrintReceipt(
            RentalReturnRequestDto request,
            String username
    ) {
        request.setHandledBy(username);

        // 1️⃣ Process return
        returnRental(request);

        // 2️⃣ Fetch updated rental
        Rental rental = rentalRepository
                .findByReceiptNumber(request.getReceiptNumber())
                .orElseThrow(() -> new IllegalStateException("Rental not found"));

        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());

        // 3️⃣ Generate return receipt PDF
        return generateRentalReturnReceiptPdf(rental, items, request);
    }

    private byte[] generateRentalReturnReceiptPdf(
            Rental rental,
            List<RentalItem> items,
            RentalReturnRequestDto request
    ) {
        try {

            java.time.format.DateTimeFormatter formatter =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");

            String categoryLabel = rental.getCategory() != null &&
                    rental.getCategory().name().equalsIgnoreCase("BICHAYAT")
                    ? "बिछायत" : "बर्तन";

            String address = rental.getAddress() != null ? rental.getAddress() : "";
            String fineAmt = (request.getFineAmount() != null && request.getFineAmount() > 0)
                    ? String.format("%,.0f", request.getFineAmount()) : "शून्य";
            String depositAmt = rental.getDepositAmount() != null
                    ? String.format("%,.0f", rental.getDepositAmount()) : "0";
            String statusLabel = rental.getStatus() == RentalStatus.CLOSED
                    ? "पूर्ण वापसी" : "आंशिक वापसी";
            String returnDate = java.time.LocalDateTime.now().format(formatter);
            String remarks = (request.getRemarks() != null && !request.getRemarks().isBlank())
                    ? request.getRemarks() : "";

            // ── Load font ──────────────────────────────────────────────────────────
            java.io.InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf");
            if (fontStream == null)
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found");

            java.awt.Font baseFont = java.awt.Font.createFont(
                    java.awt.Font.TRUETYPE_FONT, fontStream);
            fontStream.close();

            final int SCALE  = 2;
            final int W      = 420 * SCALE;
            final int H      = 595 * SCALE;
            final int M      = 36  * SCALE;
            final int LINE_H = 22  * SCALE;

            java.awt.Font fNormal    = baseFont.deriveFont(12.0f * SCALE);
            java.awt.Font fBold      = baseFont.deriveFont(java.awt.Font.BOLD, 13.0f * SCALE);
            java.awt.Font fTitle     = baseFont.deriveFont(java.awt.Font.BOLD, 16.0f * SCALE);
            java.awt.Font fSmall     = baseFont.deriveFont(11.0f * SCALE);
            java.awt.Font fSmallBold = baseFont.deriveFont(java.awt.Font.BOLD, 11.0f * SCALE);

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

            int y = 90 * SCALE;

            // Title
            String titleText = categoryLabel + " वापसी रसीद";
            java.awt.font.TextLayout titleLayout =
                    new java.awt.font.TextLayout(titleText, fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 2 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(titleX, titleBottom, titleX + titleW, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 18 * SCALE;

            // मूल रसीद क्रमांक & वापसी दिनांक
            drawRentalLine(g, "मूल रसीद: " + rental.getReceiptNumber(), M, y, fNormal, frc);
            drawRentalLine(g, "वापसी दिनांक: " + returnDate, M + 190 * SCALE, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // Customer
            drawRentalLine(g, "श्रीमान/श्रीमती " + rental.getCustomerName() + " जी द्वारा वापसी", M, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            drawRentalLine(g, "पता: " + address, M, y, fNormal, frc);
            y += LINE_H;
            drawRentalLine(g, "मोबाइल: " + rental.getMobile(), M, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // Status badge
            drawRentalLine(g, "स्थिति: " + statusLabel, M, y, fBold, frc);
            y += LINE_H + 10 * SCALE;

            // ── Items table ───────────────────────────────────────────────────────
            // col1 (name): M → col2X  (~55%)
            // col2 (जारी): col2X → col3X (~15%)
            // col3 (वापस): col3X → col4X (~15%)
            // col4 (शेष):  col4X → tableRight (~15%)
            int col1X      = M;
            int col2X      = M + 195 * SCALE;
            int col3X      = M + 255 * SCALE;
            int col4X      = M + 312 * SCALE;
            int tableRight = W - M;
            int PAD        = 6 * SCALE;

            int tableTop = y - 4 * SCALE;
            g.setColor(new java.awt.Color(230, 230, 230));
            g.fillRect(col1X, tableTop, tableRight - col1X, LINE_H + 4 * SCALE);
            g.setColor(java.awt.Color.BLACK);
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawRect(col1X, tableTop, tableRight - col1X, LINE_H + 4 * SCALE);
            g.drawLine(col2X, tableTop, col2X, tableTop + LINE_H + 4 * SCALE);
            g.drawLine(col3X, tableTop, col3X, tableTop + LINE_H + 4 * SCALE);
            g.drawLine(col4X, tableTop, col4X, tableTop + LINE_H + 4 * SCALE);

            drawRentalLine(g, "वस्तु का नाम", col1X + PAD, y + 2 * SCALE, fSmallBold, frc);
            drawRentalLine(g, "जारी",          col2X + PAD, y + 2 * SCALE, fSmallBold, frc);
            drawRentalLine(g, "वापस",          col3X + PAD, y + 2 * SCALE, fSmallBold, frc);
            drawRentalLine(g, "शेष",           col4X + PAD, y + 2 * SCALE, fSmallBold, frc);
            y += LINE_H + 4 * SCALE;

            for (RentalItem item : items) {
                int remaining = item.getIssuedQty()
                        - item.getReturnedQty()
                        - item.getDamagedQty()
                        - item.getMissingQty();
                int rowTop = y - 4 * SCALE;
                g.drawRect(col1X, rowTop, tableRight - col1X, LINE_H + 4 * SCALE);
                g.drawLine(col2X, rowTop, col2X, rowTop + LINE_H + 4 * SCALE);
                g.drawLine(col3X, rowTop, col3X, rowTop + LINE_H + 4 * SCALE);
                g.drawLine(col4X, rowTop, col4X, rowTop + LINE_H + 4 * SCALE);

                drawRentalLine(g, item.getItemNameSnapshot(),            col1X + PAD, y + 2 * SCALE, fSmall, frc);
                drawRentalLine(g, String.valueOf(item.getIssuedQty()),   col2X + PAD, y + 2 * SCALE, fSmall, frc);
                drawRentalLine(g, String.valueOf(item.getReturnedQty()), col3X + PAD, y + 2 * SCALE, fSmall, frc);
                drawRentalLine(g, String.valueOf(remaining),             col4X + PAD, y + 2 * SCALE, fSmall, frc);
                y += LINE_H + 4 * SCALE;
            }

            y += 10 * SCALE;

            // Fine, Deposit, Remarks
            drawRentalLine(g, "जुर्माना राशि: ₹ " + fineAmt + " /-", M, y, fBold, frc);
            y += LINE_H + 4 * SCALE;
            drawRentalLine(g, "जमानत राशि: ₹ " + depositAmt + " /-", M, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;
            if (!remarks.isEmpty()) {
                drawRentalLine(g, "टिप्पणी: " + remarks, M, y, fSmall, frc);
                y += LINE_H + 4 * SCALE;
            }
            y += LINE_H;

            // Signatory
            drawRentalLine(g, "प्राप्तकर्ता:", M, y, fNormal, frc);
            y += (int)(LINE_H * 1.5);
            drawRentalLine(g, "चमत्कारिक श्री हनुमान मंदिर संस्थान", M, y, fNormal, frc);
            y += LINE_H;
            drawRentalLine(g, "(हनुमान लोक) जामसावली",               M, y, fNormal, frc);
            y += LINE_H * 2;

            // Footer
            String footer = "धन्यवाद — आपके सहयोग के लिए आभार।";
            java.awt.font.TextLayout ftl =
                    new java.awt.font.TextLayout(footer, fSmall, frc);
            int fx = (int)((W - ftl.getBounds().getWidth()) / 2);
            drawRentalLine(g, footer, fx, y, fSmall, frc);
            y += LINE_H;

            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(M, y, W - M, y);
            g.dispose();

            // JPEG → PDF
            ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "JPEG", imgOut);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(
                            com.lowagie.text.PageSize.A5, 0, 0, 0, 0);
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
            throw new RuntimeException("Failed to generate rental return receipt", e);
        }
    }

    private byte[] generateRentalReceiptPdf(
            Rental rental,
            List<RentalItem> items
    ) {

        try {

            // ── 1. Build receipt values ───────────────────────────────────────────
            java.time.format.DateTimeFormatter formatter =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy");

            String categoryLabel = rental.getCategory() != null &&
                    rental.getCategory().name().equalsIgnoreCase("BICHAYAT")
                    ? "बिछायत" : "बर्तन";

            String address    = rental.getAddress() != null ? rental.getAddress() : "";
            String chargedAmt = rental.getChargedAmount() != null
                    ? String.format("%.0f", rental.getChargedAmount()) : "0";
            String depositAmt = rental.getDepositAmount() != null
                    ? String.format("%.0f", rental.getDepositAmount()) : "0";

            // ── 2. Load font ──────────────────────────────────────────────────────
            java.io.InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf");
            if (fontStream == null)
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found in resources/fonts/");

            java.awt.Font baseFont = java.awt.Font.createFont(
                    java.awt.Font.TRUETYPE_FONT, fontStream);
            fontStream.close();

            // ── 3. Coordinate system ──────────────────────────────────────────────
            // A5 = 420 × 595 pt. Render at SCALE=2 → 840 × 1190 px.
            // All layout constants are in POINTS; multiply by SCALE for pixels.
            final int SCALE  = 2;
            final int W      = 420 * SCALE;   // 840 px
            final int H      = 595 * SCALE;   // 1190 px
            final int M      = 36  * SCALE;   // left/right margin

            // Row heights (in px)
            final int LINE_H      = 20 * SCALE;   // normal text line
            final int TABLE_ROW_H = 17 * SCALE;   // compact table row — fits 10 rows easily
            final int PAD         = 5 * SCALE;    // inner cell left-padding

            java.awt.Font fNormal    = baseFont.deriveFont(11.0f * SCALE);
            java.awt.Font fBold      = baseFont.deriveFont(java.awt.Font.BOLD, 11.0f * SCALE);
            java.awt.Font fTitle     = baseFont.deriveFont(java.awt.Font.BOLD, 15.0f * SCALE);
            java.awt.Font fTableHdr  = baseFont.deriveFont(java.awt.Font.BOLD, 10.0f * SCALE);
            java.awt.Font fTableBody = baseFont.deriveFont(10.0f * SCALE);

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

            // ── Top gap for pre-printed letterhead ───────────────────────────────
            int y = 60 * SCALE;

            // ── Title (centred + underlined) ──────────────────────────────────────
            String titleText = categoryLabel + " किराया रसीद";
            java.awt.font.TextLayout titleLayout =
                    new java.awt.font.TextLayout(titleText, fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 2 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(titleX, titleBottom, titleX + titleW, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 10 * SCALE;

            // ── रसीद क्रमांक  |  दिनांक (same line, right-aligned) ──────────────
            drawRentalLine(g, "रसीद क्रमांक: " + rental.getReceiptNumber(), M, y, fNormal, frc);
            String dateStr = "दिनांक: " + rental.getCreatedAt().format(formatter);
            int dateW = (int) new java.awt.font.TextLayout(dateStr, fNormal, frc).getBounds().getWidth();
            drawRentalLine(g, dateStr, W - M - dateW, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── Customer name ─────────────────────────────────────────────────────
            drawRentalLine(g, "श्रीमान/श्रीमती " + rental.getCustomerName() + " जी को जारी", M, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── पता  |  मोबाइल (same line) ───────────────────────────────────────
            drawRentalLine(g, "पता: " + address, M, y, fNormal, frc);
            String mobStr = "मोबाइल: " + rental.getMobile();
            int mobW = (int) new java.awt.font.TextLayout(mobStr, fNormal, frc).getBounds().getWidth();
            drawRentalLine(g, mobStr, W - M - mobW, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // ── Items table ───────────────────────────────────────────────────────
            // Usable width = W - 2*M = (420-72)*2 = 696 px
            // col1 (item name) : M        → col2X   ~65%
            // col2 (qty)       : col2X    → col3X   ~16%
            // col3 (rate)      : col3X    → tableRight ~19%
            int col1X      = M;
            int col2X      = M + 228 * SCALE;
            int col3X      = M + 282 * SCALE;
            int tableRight = W - M;

            // Header
            int hdrTop = y;
            int hdrH   = TABLE_ROW_H + 2 * SCALE;
            g.setColor(new java.awt.Color(220, 220, 220));
            g.fillRect(col1X, hdrTop, tableRight - col1X, hdrH);
            g.setColor(java.awt.Color.BLACK);
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawRect(col1X, hdrTop, tableRight - col1X, hdrH);
            g.drawLine(col2X, hdrTop, col2X, hdrTop + hdrH);
            g.drawLine(col3X, hdrTop, col3X, hdrTop + hdrH);

            int textY = hdrTop + (int)(hdrH * 0.72);   // baseline inside row
            drawRentalLine(g, "वस्तु का नाम", col1X + PAD, textY, fTableHdr, frc);
            drawRentalLine(g, "मात्रा",        col2X + PAD, textY, fTableHdr, frc);
            drawRentalLine(g, "दर (₹)",        col3X + PAD, textY, fTableHdr, frc);
            y += hdrH;

            // Data rows
            int rowH = TABLE_ROW_H + 2 * SCALE;
            for (RentalItem item : items) {
                int rowTop = y;
                g.drawRect(col1X, rowTop, tableRight - col1X, rowH);
                g.drawLine(col2X, rowTop, col2X, rowTop + rowH);
                g.drawLine(col3X, rowTop, col3X, rowTop + rowH);

                int rY = rowTop + (int)(rowH * 0.72);
                String rateStr = "₹ " + String.format("%.0f", item.getRateAtIssue());
                drawRentalLine(g, item.getItemNameSnapshot(),          col1X + PAD, rY, fTableBody, frc);
                drawRentalLine(g, String.valueOf(item.getIssuedQty()), col2X + PAD, rY, fTableBody, frc);
                drawRentalLine(g, rateStr,                             col3X + PAD, rY, fTableBody, frc);
                y += rowH;
            }

            y += 6 * SCALE;

            // ── कुल किराया राशि  |  जमानत राशि (same line) ──────────────────────
            drawRentalLine(g, "कुल किराया राशि: ₹ " + chargedAmt + " /-", M, y, fBold, frc);
            String depStr = "जमानत राशि: ₹ " + depositAmt + " /-";
            int depW = (int) new java.awt.font.TextLayout(depStr, fNormal, frc).getBounds().getWidth();
            drawRentalLine(g, depStr, W - M - depW, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // ── Signatory ─────────────────────────────────────────────────────────
            drawRentalLine(g, "प्राप्तकर्ता:",                          M, y, fNormal, frc);
            y += LINE_H;
            drawRentalLine(g, "चमत्कारिक श्री हनुमान मंदिर संस्थान", M, y, fNormal, frc);
            y += LINE_H;
            drawRentalLine(g, "(हनुमान लोक) जामसावली",                M, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // ── Footer (centred) ──────────────────────────────────────────────────
            String footer = "वस्तुएँ समय पर वापस करें। क्षति पर जुर्माना लागू होगा।";
            java.awt.font.TextLayout ftl =
                    new java.awt.font.TextLayout(footer, fTableBody, frc);
            int fx = (int)((W - ftl.getBounds().getWidth()) / 2);
            drawRentalLine(g, footer, fx, y, fTableBody, frc);
            y += LINE_H;

            // ── Horizontal rule ───────────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(M, y, W - M, y);

            g.dispose();

            // ── 5. Encode BufferedImage → JPEG ────────────────────────────────────
            ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "JPEG", imgOut);

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
            throw new RuntimeException("Failed to generate rental receipt", e);
        }
    }

    /** Draw text via TextLayout — applies HarfBuzz shaping for correct Devanagari. */
    private static void drawRentalLine(java.awt.Graphics2D g, String text, int x, int y,
                                       java.awt.Font font,
                                       java.awt.font.FontRenderContext frc) {
        if (text == null || text.isEmpty()) return;
        new java.awt.font.TextLayout(text, font, frc).draw(g, x, y);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<in.temple.backend.dto.RentalSearchResultDto> searchByMobile(String mobile) {
        return rentalRepository.findByMobileContainingOrderByCreatedAtDesc(mobile)
                .stream()
                .map(this::toSearchResult)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<in.temple.backend.dto.RentalSearchResultDto> searchByName(String name) {
        return rentalRepository.findByCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(name)
                .stream()
                .map(this::toSearchResult)
                .toList();
    }

    private in.temple.backend.dto.RentalSearchResultDto toSearchResult(in.temple.backend.model.Rental r) {
        return new in.temple.backend.dto.RentalSearchResultDto(
                r.getReceiptNumber(),
                r.getCustomerName(),
                r.getMobile(),
                r.getAddress(),
                r.getCategory() != null ? r.getCategory().name() : "",
                r.getStatus() != null ? r.getStatus().name() : "",
                r.getCreatedAt()
        );
    }

    @Override
    public byte[] reprintReceipt(String receiptNumber) {
        Rental rental = rentalRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new RuntimeException("Rental not found: " + receiptNumber));
        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());
        return generateRentalReceiptPdf(rental, items);
    }

}
