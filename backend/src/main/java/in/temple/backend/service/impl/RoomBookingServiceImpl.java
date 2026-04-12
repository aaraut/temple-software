package in.temple.backend.service.impl;

import in.temple.backend.dto.*;
import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.Room;
import in.temple.backend.model.RoomBooking;
import in.temple.backend.model.RoomBookingAudit;
import in.temple.backend.model.enums.BookingStatus;
import in.temple.backend.model.enums.CleaningStatus;
import in.temple.backend.repository.RoomBookingAuditRepository;
import in.temple.backend.repository.RoomBookingRepository;
import in.temple.backend.repository.RoomRepository;
import in.temple.backend.service.RoomBookingService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final EntityManager entityManager;
    private final RoomBookingAuditRepository bookingAuditRepository;

    /**
     * Maximum number of days in advance a room can be booked.
     * Configurable via application.properties: room.booking.max-advance-days=30
     * Change the value in properties and restart — no code change needed.
     */
    @Value("${room.booking.max-advance-days:30}")
    private int maxAdvanceBookingDays;


    @Override
    @Transactional
    public String createBooking(RoomBookingCreateRequestDto request) {

        // 1️⃣ Generate booking number (like rental)
        Long seq = ((Number) entityManager
                .createNativeQuery("SELECT nextval('room_booking_seq')")
                .getSingleResult()).longValue();

        String bookingNumber = "ROOM-" + Year.now().getValue()
                + "-" + String.format("%07d", seq);

        // 2️⃣ Lock room row (pessimistic)
        Room room = entityManager.find(
                Room.class,
                request.getRoomId(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (room == null) {
            throw new NotFoundException("Room not found with id: " + request.getRoomId());
        }

        if (!room.getStatus().name().equals("AVAILABLE")) {
            throw new RuntimeException("Room not available for booking");
        }

        // 3️⃣ Overlap check
        boolean overlap = bookingRepository.existsOverlappingBooking(
                room.getId(),
                List.of(BookingStatus.BOOKED, BookingStatus.CHECKED_IN),
                request.getScheduledCheckIn(),
                request.getScheduledCheckOut()
        );

        if (overlap) {
            throw new RuntimeException("Room already booked for selected time");
        }

        // ✅ Advance booking limit check
        LocalDateTime maxAllowedCheckIn = LocalDateTime.now().plusDays(maxAdvanceBookingDays);
        if (request.getScheduledCheckIn().isAfter(maxAllowedCheckIn)) {
            throw new RuntimeException(
                    "Booking cannot be made more than " + maxAdvanceBookingDays +
                            " days in advance. Earliest allowed check-in: " +
                            maxAllowedCheckIn.toLocalDate()
            );
        }

        // 4️⃣ Determine base amount based on booking type
        BigDecimal baseAmount;

        switch (request.getBookingType()) {
            case TWENTY_FOUR_HOUR -> baseAmount = room.getBaseRent24Hr();
            case FIXED_SLOT -> baseAmount = room.getBaseRentFixed();
            case THREE_HOUR -> baseAmount = room.getBaseRent3Hr();
            case SIX_HOUR -> baseAmount = room.getBaseRent6Hr();
            default -> throw new RuntimeException("Invalid booking type");
        }

        BigDecimal surcharge = request.getExtraSurchargeAmount() == null
                ? BigDecimal.ZERO : request.getExtraSurchargeAmount();

        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? BigDecimal.ZERO : request.getExtraChargeAmount();

        BigDecimal grossAmount = baseAmount
                .add(surcharge)
                .add(extraCharge);

        RoomBooking booking = RoomBooking.builder()
                .bookingNumber(bookingNumber)
                .room(room)
                .customerName(request.getCustomerName())
                .mobileNumber(request.getMobileNumber())
                .idProofType(request.getIdProofType())
                .idProofNumber(request.getIdProofNumber())
                .bookingType(request.getBookingType())
                .scheduledCheckIn(request.getScheduledCheckIn())
                .scheduledCheckOut(request.getScheduledCheckOut())
                .baseAmount(baseAmount)
                .extraSurchargeAmount(surcharge)
                .extraChargeAmount(extraCharge)
                .grossAmount(grossAmount)
                .securityDeposit(request.getSecurityDeposit())
                .netPayableAmount(grossAmount)
                .status(BookingStatus.BOOKED)
                .createdBy(request.getCreatedBy())
                .build();

        RoomBooking saved = bookingRepository.save(booking);

        String auditDetails = String.format(
                "Room: %s (Block %s) | Customer: %s | Mobile: %s | ID: %s (%s) | " +
                        "CheckIn: %s | CheckOut: %s | Type: %s | Base: %.2f | Surcharge: %.2f | " +
                        "ExtraCharge: %.2f | Gross: %.2f | Deposit: %.2f",
                room.getRoomNumber(), room.getBlockName(),
                request.getCustomerName(), request.getMobileNumber(),
                request.getIdProofNumber(), request.getIdProofType(),
                request.getScheduledCheckIn(), request.getScheduledCheckOut(),
                request.getBookingType(),
                baseAmount, surcharge, extraCharge, grossAmount,
                request.getSecurityDeposit() != null ? request.getSecurityDeposit() : BigDecimal.ZERO
        );

        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(saved.getId())
                        .action("CREATE")
                        .details(auditDetails)
                        .performedBy(request.getCreatedBy())
                        .build()
        );

        log.info("ROOM_BOOKING CREATE | bookingNumber={} | room={} | customer={} | by={}",
                bookingNumber, room.getRoomNumber(), request.getCustomerName(), request.getCreatedBy());

        return bookingNumber;
    }

    @Override
    @Transactional
    public void checkIn(RoomCheckInRequestDto request) {

        RoomBooking booking = bookingRepository
                .findByBookingNumber(request.getBookingNumber())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Invalid booking number: "
                                        + request.getBookingNumber()
                        )
                );


        if (booking.getStatus() == BookingStatus.CHECKED_IN) {
            throw new RuntimeException("Booking already checked in");
        }

        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new RuntimeException(
                    "Only BOOKED status can be checked in"
            );
        }

        booking.setActualCheckInTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.CHECKED_IN);

        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(booking.getId())
                        .action("CHECK_IN")
                        .details(String.format("Guest checked in at: %s | Room: %s | Customer: %s | Mobile: %s",
                                booking.getActualCheckInTime(),
                                booking.getRoom().getRoomNumber(),
                                booking.getCustomerName(),
                                booking.getMobileNumber()))
                        .performedBy(request.getHandledBy())
                        .build()
        );

        log.info("ROOM_BOOKING CHECK_IN | bookingNumber={} | room={} | customer={} | by={}",
                booking.getBookingNumber(), booking.getRoom().getRoomNumber(),
                booking.getCustomerName(), request.getHandledBy());
    }

    @Override
    @Transactional
    public void checkout(RoomCheckoutRequestDto request) {

        RoomBooking booking = bookingRepository
                .findByBookingNumber(request.getBookingNumber())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Invalid booking number: "
                                        + request.getBookingNumber()
                        )
                );

        if (booking.getStatus() == BookingStatus.CHECKED_OUT) {
            throw new RuntimeException("Booking already checked out");
        }

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new RuntimeException(
                    "Only CHECKED_IN booking can be checked out"
            );
        }

        // 1️⃣ Update extra charge if provided
        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? booking.getExtraChargeAmount()
                : request.getExtraChargeAmount();

        booking.setExtraChargeAmount(extraCharge);

        // 2️⃣ Recalculate gross amount
        BigDecimal gross = booking.getBaseAmount()
                .add(booking.getExtraSurchargeAmount())
                .add(extraCharge);

        booking.setGrossAmount(gross);
        booking.setNetPayableAmount(gross);

        // 3️⃣ Apply deposit deduction
        BigDecimal deduction = request.getDeductionFromDeposit() == null
                ? BigDecimal.ZERO
                : request.getDeductionFromDeposit();

        if (deduction.compareTo(booking.getSecurityDeposit()) > 0) {
            throw new RuntimeException("Deduction cannot exceed deposit");
        }

        booking.setDeductionFromDeposit(deduction);

        // 4️⃣ Update checkout time
        booking.setActualCheckOutTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.CHECKED_OUT);

        // 5️⃣ Mark room as DIRTY
        Room room = booking.getRoom();
        room.setCleaningStatus(
                in.temple.backend.model.enums.CleaningStatus.DIRTY
        );

        // 6️⃣ Audit entry
        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(booking.getId())
                        .action("CHECK_OUT")
                        .details(String.format(
                                "Checkout at: %s | Room: %s | Customer: %s | Mobile: %s | " +
                                        "Deduction: %.2f | ExtraCharge: %.2f | NetPayable: %.2f | Remarks: %s",
                                booking.getActualCheckOutTime(),
                                room.getRoomNumber(),
                                booking.getCustomerName(),
                                booking.getMobileNumber(),
                                deduction, extraCharge, booking.getNetPayableAmount(),
                                request.getRemarks()))
                        .performedBy(request.getHandledBy())
                        .build()
        );

        log.info("ROOM_BOOKING CHECK_OUT | bookingNumber={} | room={} | customer={} | netPayable={} | by={}",
                booking.getBookingNumber(), room.getRoomNumber(),
                booking.getCustomerName(), booking.getNetPayableAmount(), request.getHandledBy());
    }

    @Override
    @Transactional
    public String shiftRoom(RoomShiftRequestDto request) {

        // 1️⃣ Fetch old booking
        RoomBooking oldBooking = bookingRepository
                .findByBookingNumber(request.getOldBookingNumber())
                .orElseThrow(() ->
                        new NotFoundException("Invalid booking number: "
                                + request.getOldBookingNumber())
                );

        if (oldBooking.getStatus() != BookingStatus.BOOKED
                && oldBooking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new RuntimeException(
                    "Only BOOKED or CHECKED_IN booking can be shifted"
            );
        }

        // 2️⃣ Lock new room
        Room newRoom = entityManager.find(
                Room.class,
                request.getNewRoomId(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (newRoom == null) {
            throw new NotFoundException("New room not found");
        }

        // 3️⃣ Overlap check for new room
        boolean overlap = bookingRepository.existsOverlappingBooking(
                newRoom.getId(),
                List.of(BookingStatus.BOOKED, BookingStatus.CHECKED_IN),
                request.getNewScheduledCheckIn(),
                request.getNewScheduledCheckOut()
        );

        if (overlap) {
            throw new RuntimeException("New room already booked for selected time");
        }

        // 4️⃣ Settle old booking (manual adjustments)
        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? oldBooking.getExtraChargeAmount()
                : request.getExtraChargeAmount();

        BigDecimal deduction = request.getDeductionFromDeposit() == null
                ? BigDecimal.ZERO
                : request.getDeductionFromDeposit();

        if (deduction.compareTo(oldBooking.getSecurityDeposit()) > 0) {
            throw new RuntimeException("Deduction exceeds deposit");
        }

        oldBooking.setExtraChargeAmount(extraCharge);

        BigDecimal gross = oldBooking.getBaseAmount()
                .add(oldBooking.getExtraSurchargeAmount())
                .add(extraCharge);

        oldBooking.setGrossAmount(gross);
        oldBooking.setNetPayableAmount(gross);
        oldBooking.setDeductionFromDeposit(deduction);

        oldBooking.setActualCheckOutTime(LocalDateTime.now());
        oldBooking.setStatus(BookingStatus.ROOM_SHIFTED);

        // mark old room dirty
        oldBooking.getRoom()
                .setCleaningStatus(
                        in.temple.backend.model.enums.CleaningStatus.DIRTY
                );

        // 5️⃣ Carry forward remaining deposit
        BigDecimal carryForwardDeposit =
                oldBooking.getSecurityDeposit().subtract(deduction);

        // 6️⃣ Create new booking
        Long seq = ((Number) entityManager
                .createNativeQuery("SELECT nextval('room_booking_seq')")
                .getSingleResult()).longValue();

        String newBookingNumber = "ROOM-"
                + java.time.Year.now().getValue()
                + "-" + String.format("%07d", seq);

        BigDecimal baseAmount;

        switch (oldBooking.getBookingType()) {
            case TWENTY_FOUR_HOUR -> baseAmount = newRoom.getBaseRent24Hr();
            case FIXED_SLOT -> baseAmount = newRoom.getBaseRentFixed();
            case THREE_HOUR -> baseAmount = newRoom.getBaseRent3Hr();
            case SIX_HOUR -> baseAmount = newRoom.getBaseRent6Hr();
            default -> throw new RuntimeException("Invalid booking type");
        }

        RoomBooking newBooking = RoomBooking.builder()
                .bookingNumber(newBookingNumber)
                .room(newRoom)
                .customerName(oldBooking.getCustomerName())
                .mobileNumber(oldBooking.getMobileNumber())
                .idProofType(oldBooking.getIdProofType())
                .idProofNumber(oldBooking.getIdProofNumber())
                .bookingType(oldBooking.getBookingType())
                .scheduledCheckIn(request.getNewScheduledCheckIn())
                .scheduledCheckOut(request.getNewScheduledCheckOut())
                .baseAmount(baseAmount)
                .extraSurchargeAmount(BigDecimal.ZERO)
                .extraChargeAmount(BigDecimal.ZERO)
                .grossAmount(baseAmount)
                .securityDeposit(carryForwardDeposit)
                .netPayableAmount(baseAmount)
                .status(BookingStatus.BOOKED)
                .shiftedFromBookingId(oldBooking.getId())
                .createdBy(request.getHandledBy())
                .build();

        bookingRepository.save(newBooking);

        oldBooking.setShiftedToBookingId(newBooking.getId());

        // 7️⃣ Audit entries
        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(oldBooking.getId())
                        .action("ROOM_SHIFTED")
                        .details(String.format("Shifted to booking: %s | New room: %s | by: %s",
                                newBookingNumber, newRoom.getRoomNumber(), request.getHandledBy()))
                        .performedBy(request.getHandledBy())
                        .build()
        );

        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(newBooking.getId())
                        .action("CREATE_FROM_SHIFT")
                        .details(String.format("Created from booking: %s | Old room: %s | New room: %s",
                                oldBooking.getBookingNumber(),
                                oldBooking.getRoom().getRoomNumber(),
                                newRoom.getRoomNumber()))
                        .performedBy(request.getHandledBy())
                        .build()
        );

        log.info("ROOM_BOOKING SHIFT | old={} | new={} | oldRoom={} | newRoom={} | by={}",
                oldBooking.getBookingNumber(), newBookingNumber,
                oldBooking.getRoom().getRoomNumber(), newRoom.getRoomNumber(), request.getHandledBy());

        return newBookingNumber;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomAvailabilityDto> getAvailability(
            LocalDateTime start,
            LocalDateTime end) {

        // Basic validation
        if (start == null || end == null) {
            throw new RuntimeException("Start and End date required");
        }

        if (!end.isAfter(start)) {
            throw new RuntimeException("End date must be after start date");
        }

        List<Room> rooms = roomRepository.findAll();

        return rooms.stream()
                .map(room -> {

                    // 1️⃣ If room inactive → not available
//                    if (!room.isActive()) {
//                        return buildDto(room, false);
//                    }

                    // 2️⃣ Check booking overlap
                    boolean occupied = bookingRepository
                            .isRoomOccupied(
                                    room.getId(),
                                    start,
                                    end
                            );

                    // 3️⃣ Cleaning status is informational only — does not block booking.
                    // A dirty room can still be booked; the frontend shows a warning to the entry boy.
                    boolean available = !occupied;

                    return buildDto(room, available);

                })
                .toList();
    }

    private RoomAvailabilityDto buildDto(Room room, boolean available) {

        return RoomAvailabilityDto.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .blockName(room.getBlockName())
                .roomStatus(room.getStatus())
                .cleaningStatus(room.getCleaningStatus())
                .available(available)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomBookingSummaryDto> searchBookings(
            RoomBookingSearchRequestDto request) {

        return bookingRepository.searchBookings(
                        request.getBookingNumber(),
                        request.getCustomerName(),
                        request.getMobileNumber(),
                        request.getStatus() == null ? null : request.getStatus().name(),
                        request.getFromDate(),
                        request.getToDate()
                )
                .stream()
                .map(rb -> RoomBookingSummaryDto.builder()
                        .bookingNumber(rb.getBookingNumber())
                        .roomNumber(rb.getRoom().getRoomNumber())
                        .customerName(rb.getCustomerName())
                        .mobileNumber(rb.getMobileNumber())
                        .status(rb.getStatus())
                        .scheduledCheckIn(rb.getScheduledCheckIn())
                        .scheduledCheckOut(rb.getScheduledCheckOut())
                        .grossAmount(rb.getGrossAmount())
                        .build())
                .toList();
    }


    @Override
    @Transactional
    public void cancelBooking(RoomBookingCancelRequestDto request) {

        RoomBooking booking = bookingRepository
                .findByBookingNumber(request.getBookingNumber())
                .orElseThrow(() ->
                        new NotFoundException(
                                "Invalid booking number: "
                                        + request.getBookingNumber()
                        )
                );

        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new RuntimeException(
                    "Only BOOKED booking can be cancelled"
            );
        }

        BigDecimal cancellationCharge = request.getCancellationCharge() == null
                ? BigDecimal.ZERO
                : request.getCancellationCharge();

        if (cancellationCharge.compareTo(booking.getSecurityDeposit()) > 0) {
            throw new RuntimeException(
                    "Cancellation charge cannot exceed deposit"
            );
        }

        // Deduct from deposit
        booking.setDeductionFromDeposit(cancellationCharge);

        booking.setActualCheckOutTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.CANCELLED);

        // Audit entry
        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(booking.getId())
                        .action("CANCELLED")
                        .details(String.format(
                                "Booking cancelled | Room: %s | Customer: %s | Mobile: %s | Charge: %.2f | Remarks: %s",
                                booking.getRoom().getRoomNumber(),
                                booking.getCustomerName(),
                                booking.getMobileNumber(),
                                cancellationCharge,
                                request.getRemarks()))
                        .performedBy(request.getHandledBy())
                        .build()
        );

        log.info("ROOM_BOOKING CANCEL | bookingNumber={} | room={} | customer={} | charge={} | by={}",
                booking.getBookingNumber(), booking.getRoom().getRoomNumber(),
                booking.getCustomerName(), cancellationCharge, request.getHandledBy());
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyReportDto getOccupancyReport() {

        Long total = bookingRepository.countActiveRooms();
        Long occupied = bookingRepository.countOccupiedRooms();

        double percentage = total == 0
                ? 0
                : (occupied * 100.0) / total;

        return new OccupancyReportDto(
                total,
                occupied,
                percentage
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueReportDto getRevenue(
            String username,
            LocalDateTime start,
            LocalDateTime end) {

        List<Object[]> result =
                bookingRepository.getRevenueRaw(username, start, end);

        if (result.isEmpty()) {
            return new RevenueReportDto(
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO
            );
        }

        Object[] raw = result.get(0);

        BigDecimal rent = toBigDecimal(raw[0]);
        BigDecimal depositCollected = toBigDecimal(raw[1]);
        BigDecimal depositRefunded = toBigDecimal(raw[2]);

        BigDecimal cancellationCharge = BigDecimal.ZERO;

        BigDecimal netCash =
                rent
                        .add(depositCollected)
                        .subtract(depositRefunded);

        return new RevenueReportDto(
                rent,
                depositCollected,
                depositRefunded,
                cancellationCharge,
                netCash
        );
    }

    private BigDecimal toBigDecimal(Object value) {

        if (value == null) return BigDecimal.ZERO;

        if (value instanceof BigDecimal)
            return (BigDecimal) value;

        if (value instanceof Double)
            return BigDecimal.valueOf((Double) value);

        if (value instanceof Long)
            return BigDecimal.valueOf((Long) value);

        if (value instanceof Integer)
            return BigDecimal.valueOf((Integer) value);

        if (value instanceof java.math.BigInteger)
            return new BigDecimal((java.math.BigInteger) value);

        return BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public RoomBookingDetailDto getBookingDetail(String bookingNumber) {
        RoomBooking b = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingNumber));

        return RoomBookingDetailDto.builder()
                .bookingNumber(b.getBookingNumber())
                .roomId(b.getRoom().getId())
                .roomNumber(b.getRoom().getRoomNumber())
                .blockName(b.getRoom().getBlockName())
                .customerName(b.getCustomerName())
                .mobileNumber(b.getMobileNumber())
                .idProofType(b.getIdProofType())
                .idProofNumber(b.getIdProofNumber())
                .bookingType(b.getBookingType())
                .status(b.getStatus())
                .scheduledCheckIn(b.getScheduledCheckIn())
                .scheduledCheckOut(b.getScheduledCheckOut())
                .actualCheckInTime(b.getActualCheckInTime())
                .actualCheckOutTime(b.getActualCheckOutTime())
                .baseAmount(b.getBaseAmount())
                .extraSurchargeAmount(b.getExtraSurchargeAmount())
                .extraChargeAmount(b.getExtraChargeAmount())
                .grossAmount(b.getGrossAmount())
                .securityDeposit(b.getSecurityDeposit())
                .netPayableAmount(b.getNetPayableAmount())
                .createdBy(b.getCreatedBy())
                .createdAt(b.getCreatedAt())
                .build();
    }

    // =========================================================================
    // CREATE BOOKING AND RETURN RECEIPT PDF
    // =========================================================================

    @Override
    @Transactional
    public byte[] printBookingReceipt(String bookingNumber) {
        RoomBooking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingNumber));

        byte[] pdf = generateBookingReceiptPdf(booking);

        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(booking.getId())
                        .action("RECEIPT_PRINTED")
                        .details(String.format(
                                "Receipt printed | Room: %s | Customer: %s | Status: %s",
                                booking.getRoom().getRoomNumber(),
                                booking.getCustomerName(),
                                booking.getStatus()))
                        .performedBy(booking.getCreatedBy())
                        .build()
        );

        log.info("ROOM_BOOKING RECEIPT_PRINTED | bookingNumber={} | room={} | customer={}",
                bookingNumber, booking.getRoom().getRoomNumber(), booking.getCustomerName());

        return pdf;
    }

    private byte[] generateBookingReceiptPdf(RoomBooking booking) {
        try {
            // AM/PM datetime formatter
            java.time.format.DateTimeFormatter dtFmt =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a");

            String checkIn   = booking.getScheduledCheckIn()  != null ? booking.getScheduledCheckIn().format(dtFmt)  : "";
            String checkOut  = booking.getScheduledCheckOut() != null ? booking.getScheduledCheckOut().format(dtFmt)  : "";
            String createdOn = booking.getCreatedAt()         != null ? booking.getCreatedAt().format(dtFmt)          : "";

            Room room = booking.getRoom();
            String roomInfo = "कक्ष " + room.getRoomNumber() + " - ब्लॉक " + room.getBlockName();

            String grossAmt   = String.format("%,.0f", booking.getGrossAmount()    != null ? booking.getGrossAmount()    : java.math.BigDecimal.ZERO);
            String depositAmt = String.format("%,.0f", booking.getSecurityDeposit() != null ? booking.getSecurityDeposit() : java.math.BigDecimal.ZERO);

            // ── Font ──────────────────────────────────────────────────────────
            java.io.InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf");
            if (fontStream == null)
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found");

            java.awt.Font baseFont = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, fontStream);
            fontStream.close();

            final int SCALE  = 2;
            final int W      = 420 * SCALE;
            final int H      = 595 * SCALE;
            final int M      = 36  * SCALE;   // left/right margin
            final int RIGHT  = W - M;          // right edge
            final int LINE_H = 22  * SCALE;

            java.awt.Font fNormal = baseFont.deriveFont(12.0f * SCALE);
            java.awt.Font fBold   = baseFont.deriveFont(java.awt.Font.BOLD, 13.0f * SCALE);
            java.awt.Font fTitle  = baseFont.deriveFont(java.awt.Font.BOLD, 16.0f * SCALE);
            java.awt.Font fSmall  = baseFont.deriveFont(10.5f * SCALE);
            java.awt.Font fTiny   = baseFont.deriveFont(9.5f * SCALE);

            // ── Canvas ────────────────────────────────────────────────────────
            java.awt.image.BufferedImage img =
                    new java.awt.image.BufferedImage(W, H, java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g = img.createGraphics();

            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, W, H);
            g.setColor(java.awt.Color.BLACK);
            g.setRenderingHint(java.awt.RenderingHints.KEY_TEXT_ANTIALIASING,
                    java.awt.RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(java.awt.RenderingHints.KEY_FRACTIONALMETRICS,
                    java.awt.RenderingHints.VALUE_FRACTIONALMETRICS_ON);

            java.awt.font.FontRenderContext frc = g.getFontRenderContext();

            // helper — draw right-aligned text ending at x
            java.util.function.Consumer<Object[]> drawRight = (args) -> {
                String text = (String) args[0];
                int rx      = (int)   args[1];
                int ry      = (int)   args[2];
                java.awt.Font f = (java.awt.Font) args[3];
                java.awt.font.TextLayout tl = new java.awt.font.TextLayout(text, f, frc);
                int tw = (int) tl.getBounds().getWidth();
                tl.draw(g, rx - tw, ry);
            };

            int y = 90 * SCALE;

            // ── Title ─────────────────────────────────────────────────────────
            java.awt.font.TextLayout titleLayout =
                    new java.awt.font.TextLayout("भक्त निवास बुकिंग रसीद", fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 2 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(titleX, titleBottom, titleX + titleW, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 18 * SCALE;

            // ── Booking number & date ─────────────────────────────────────────
            drawBookingLine(g, "रसीद क्रमांक: " + booking.getBookingNumber(), M, y, fNormal, frc);
            drawBookingLine(g, "दिनांक: " + createdOn, M + 200 * SCALE, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // ── Customer ──────────────────────────────────────────────────────
            drawBookingLine(g, "अतिथि नाम: " + booking.getCustomerName(), M, y, fBold, frc);
            y += LINE_H + 4 * SCALE;
            drawBookingLine(g, "मोबाइल: " + booking.getMobileNumber(), M, y, fNormal, frc);
            drawBookingLine(g, "पहचान पत्र (" + booking.getIdProofType().name() + "): " + booking.getIdProofNumber(), M + 190 * SCALE, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Room details ──────────────────────────────────────────────────
            drawBookingLine(g, roomInfo, M, y, fBold, frc);
            y += LINE_H + 6 * SCALE;

            // Check-in and check-out on ONE line
            drawBookingLine(g, "चेक-इन: " + checkIn, M, y, fNormal, frc);
            drawBookingLine(g, "चेक-आउट: " + checkOut, M + 190 * SCALE, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Amount table — left label, right-aligned amount ───────────────
            // col2X is the right edge for amounts — same as RIGHT
            drawBookingLine(g, "बेस किराया:", M, y, fNormal, frc);
            drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getBaseAmount() != null ? booking.getBaseAmount() : java.math.BigDecimal.ZERO), RIGHT, y, fNormal});
            y += LINE_H;

            if (booking.getExtraSurchargeAmount() != null && booking.getExtraSurchargeAmount().signum() > 0) {
                drawBookingLine(g, "अतिरिक्त सरचार्ज:", M, y, fNormal, frc);
                drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getExtraSurchargeAmount()), RIGHT, y, fNormal});
                y += LINE_H;
            }

            if (booking.getExtraChargeAmount() != null && booking.getExtraChargeAmount().signum() > 0) {
                drawBookingLine(g, "अतिरिक्त शुल्क:", M, y, fNormal, frc);
                drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getExtraChargeAmount()), RIGHT, y, fNormal});
                y += LINE_H;
            }

            y += 6 * SCALE;
            // Subtotal rule — full width M to RIGHT
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 18 * SCALE;

            drawBookingLine(g, "कुल राशि:", M, y, fBold, frc);
            drawRight.accept(new Object[]{"₹ " + grossAmt + " /-", RIGHT, y, fBold});
            y += LINE_H;

            drawBookingLine(g, "जमानत राशि:", M, y, fNormal, frc);
            drawRight.accept(new Object[]{"₹ " + depositAmt + " /-", RIGHT, y, fNormal});
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Signatory ─────────────────────────────────────────────────────
            drawBookingLine(g, "प्राप्तकर्ता:", M, y, fNormal, frc);
            y += (int)(LINE_H * 1.5);
            drawBookingLine(g, booking.getCreatedBy(), M, y, fNormal, frc); y += LINE_H;
            drawBookingLine(g, "चमत्कारिक श्री हनुमान मंदिर संस्थान", M, y, fNormal, frc); y += LINE_H;
            drawBookingLine(g, "(हनुमान लोक) जामसावली", M, y, fNormal, frc);
            y += LINE_H + 14 * SCALE;

            // ── Terms & Conditions (below signatory, no HR above/below) ──────
            drawBookingLine(g, "नियम एवं शर्तें:", M, y, fBold, frc);
            y += LINE_H + 2 * SCALE;
            drawBookingLine(g, "1. बुकिंग किसी भी परिस्थिति में रद्द नहीं होगी और कोई धनवापसी नहीं दी जाएगी।", M, y, fTiny, frc);
            y += (int)(LINE_H * 0.95);
            drawBookingLine(g, "2. देर से चेक-आउट किसी भी स्थिति में स्वीकार्य नहीं है।", M, y, fTiny, frc);
            y += (int)(LINE_H * 0.95);
            drawBookingLine(g, "   प्रातः 10 बजे तक कक्ष खाली न करने पर पूर्ण दिन का शुल्क देय होगा।", M, y, fTiny, frc);
            y += LINE_H + 12 * SCALE;

            // ── Footer ────────────────────────────────────────────────────────
            String footer = "कृपया चेक-आउट के समय यह रसीद प्रस्तुत करें।";
            java.awt.font.TextLayout tl = new java.awt.font.TextLayout(footer, fSmall, frc);
            int fx = (int)((W - tl.getBounds().getWidth()) / 2);
            drawBookingLine(g, footer, fx, y, fSmall, frc);
            y += LINE_H;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(M, y, RIGHT, y);

            g.dispose();

            // ── JPEG → PDF ────────────────────────────────────────────────────
            java.io.ByteArrayOutputStream imgOut = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "JPEG", imgOut);

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(com.lowagie.text.PageSize.A5, 0, 0, 0, 0);
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
            log.error("ROOM_BOOKING PDF_ERROR | bookingNumber={} | error={}",
                    booking.getBookingNumber(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate room booking receipt PDF", e);
        }
    }

    private static void drawBookingLine(java.awt.Graphics2D g, String text, int x, int y,
                                        java.awt.Font font, java.awt.font.FontRenderContext frc) {
        if (text == null || text.isEmpty()) return;
        new java.awt.font.TextLayout(text, font, frc).draw(g, x, y);
    }

}
