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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final EntityManager entityManager;
    private final RoomBookingAuditRepository bookingAuditRepository;


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
        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(saved.getId())
                        .action("CREATE")
                        .details("Booking created for room: "
                                + room.getRoomNumber()
                                + ", From: " + request.getScheduledCheckIn()
                                + ", To: " + request.getScheduledCheckOut())
                        .performedBy(request.getCreatedBy())
                        .build()
        );
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
                        .details("Guest checked in at: "
                                + booking.getActualCheckInTime())
                        .performedBy(request.getHandledBy())
                        .build()
        );
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
                        .details("Checkout completed. Deduction: "
                                + deduction
                                + ", ExtraCharge: "
                                + extraCharge
                                + ", Remarks: "
                                + request.getRemarks())
                        .performedBy(request.getHandledBy())
                        .build()
        );
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
                        .details("Shifted to booking: "
                                + newBookingNumber)
                        .performedBy(request.getHandledBy())
                        .build()
        );

        bookingAuditRepository.save(
                RoomBookingAudit.builder()
                        .bookingId(newBooking.getId())
                        .action("CREATE_FROM_SHIFT")
                        .details("Created from booking: "
                                + oldBooking.getBookingNumber())
                        .performedBy(request.getHandledBy())
                        .build()
        );

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

                    // 3️⃣ Cleaning status check
                    boolean cleaningBlocked =
                            room.getCleaningStatus() == CleaningStatus.DIRTY
                                    || room.getCleaningStatus() == CleaningStatus.CLEANING_IN_PROGRESS;

                    boolean available = !occupied && !cleaningBlocked;

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
                        .details("Booking cancelled. Charge: "
                                + cancellationCharge
                                + ", Remarks: "
                                + request.getRemarks())
                        .performedBy(request.getHandledBy())
                        .build()
        );
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

}
