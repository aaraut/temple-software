package in.temple.backend.service.impl;

import in.temple.backend.dto.*;
import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.Room;
import in.temple.backend.model.RoomBooking;
import in.temple.backend.model.RoomBookingAudit;
import in.temple.backend.model.User;
import in.temple.backend.model.enums.BookingStatus;
import in.temple.backend.model.enums.BookingType;
import in.temple.backend.model.enums.CleaningStatus;
import in.temple.backend.model.enums.PricingType;
import in.temple.backend.repository.RoomBookingAuditRepository;
import in.temple.backend.repository.RoomBookingRepository;
import in.temple.backend.repository.RoomAuditRepository;
import in.temple.backend.repository.RoomBlockRepository;
import in.temple.backend.repository.RoomRepository;
import in.temple.backend.service.AppConfigService;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.RoomBookingService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.time.LocalDate;
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
    private final RoomAuditRepository roomAuditRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final AppConfigService appConfigService;
    private final AuthContextService authContextService;

    private static final int PERSON_COUNT_BASE_PERSONS = 2;


    @Override
    @Transactional
    public String createBooking(RoomBookingCreateRequestDto request) {

        // 1️⃣ Lock room row (pessimistic)
        Room room = entityManager.find(
                Room.class,
                request.getRoomId(),
                LockModeType.PESSIMISTIC_WRITE
        );

        if (room == null) {
            throw new NotFoundException("Room not found with id: " + request.getRoomId());
        }

        // Check room is not in MAINTENANCE
        if (room.getStatus() == in.temple.backend.model.enums.RoomStatus.MAINTENANCE) {
            throw new RuntimeException("Room is under maintenance");
        }

        // Room must not already have an active occupant — same-day re-use after checkout is fine,
        // but a room can't hold two independent bookings at once
        if (bookingRepository.existsByRoomIdAndStatus(room.getId(), BookingStatus.CHECKED_IN)) {
            throw new RuntimeException("Room is currently occupied — checkout the current guest before booking again");
        }

        // 2️⃣ Day-cycle: booking always belongs to "now", per the configured cutover hour
        LocalDateTime now = LocalDateTime.now();
        LocalDate bookingDate = computeBookingDate(now);
        LocalDateTime scheduledCheckOut = computeScheduledCheckOut(bookingDate);

        // Check room_block table for date-range specific blocks covering the booking day
        if (roomBlockRepository.isRoomBlockedForPeriod(room.getId(),
                bookingDate.atStartOfDay(), bookingDate.plusDays(1).atStartOfDay())) {
            throw new RuntimeException("Room is blocked for this period — no bookings allowed");
        }

        // 3️⃣ Occupancy validation — a room's maxOccupancy already encodes the NA-strict rule
        int numPersons = request.getNumPersons() == null ? 1 : request.getNumPersons();
        if (room.getMaxOccupancy() != null && numPersons > room.getMaxOccupancy()) {
            throw new RuntimeException(
                    "Number of persons (" + numPersons + ") exceeds this room's max occupancy ("
                            + room.getMaxOccupancy() + ")"
            );
        }

        // 4️⃣ Base amount — FIXED per category, or PERSON_COUNT (base covers 2 persons + extra-person cost)
        BigDecimal baseAmount = calculateBaseAmount(room, numPersons);

        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? BigDecimal.ZERO : request.getExtraChargeAmount();

        BigDecimal securityDeposit = request.getSecurityDeposit() == null
                ? BigDecimal.ZERO : request.getSecurityDeposit();

        BigDecimal grossAmount = baseAmount.add(extraCharge);

        // 5️⃣ No cap on bookings per room per day — slotNumber is just a display-order counter
        long existingCount = bookingRepository.countByRoomIdAndBookingDate(room.getId(), bookingDate);
        int slotNumber = (int) existingCount + 1;

        String bookingNumber = generateBookingNumber(request.getCreatedBy());

        RoomBooking booking = RoomBooking.builder()
                .bookingNumber(bookingNumber)
                .room(room)
                .customerName(request.getCustomerName())
                .mobileNumber(request.getMobileNumber())
                .idProofType(request.getIdProofType())
                .idProofNumber(request.getIdProofNumber())
                .bookingType(BookingType.TWENTY_FOUR_HOUR)
                .numPersons(numPersons)
                .bookingDate(bookingDate)
                .slotNumber(slotNumber)
                .scheduledCheckIn(now)
                .scheduledCheckOut(scheduledCheckOut)
                .actualCheckInTime(now)
                .baseAmount(baseAmount)
                .extraSurchargeAmount(BigDecimal.ZERO)
                .extraChargeAmount(extraCharge)
                .grossAmount(grossAmount)
                .securityDeposit(securityDeposit)
                .netPayableAmount(grossAmount)
                .status(BookingStatus.CHECKED_IN)
                .createdBy(request.getCreatedBy())
                .build();

        RoomBooking saved = bookingRepository.save(booking);

        String auditDetails = String.format(
                "Room: %s (Block %s) | Customer: %s | Mobile: %s | ID: %s (%s) | " +
                        "Persons: %d | BookingDate: %s | Slot: %d | Base: %.2f | " +
                        "ExtraCharge: %.2f | Gross: %.2f | Deposit: %.2f",
                room.getRoomNumber(), room.getBhaktniwasBlock().getDisplayName(),
                request.getCustomerName(), request.getMobileNumber(),
                request.getIdProofNumber(), request.getIdProofType(),
                numPersons, bookingDate, slotNumber,
                baseAmount, extraCharge, grossAmount, securityDeposit
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

    private LocalDate computeBookingDate(LocalDateTime checkInTime) {
        int dayStartHour = appConfigService.getInt("dayStartHour", 6);
        LocalDate date = checkInTime.toLocalDate();
        return checkInTime.getHour() >= dayStartHour ? date : date.minusDays(1);
    }

    private LocalDateTime computeScheduledCheckOut(LocalDate bookingDate) {
        int dayStartHour = appConfigService.getInt("dayStartHour", 6);
        return bookingDate.plusDays(1).atTime(dayStartHour, 0);
    }

    private BigDecimal calculateBaseAmount(Room room, int numPersons) {
        if (room.getCategory().getPricingType() == PricingType.PERSON_COUNT) {
            int extraPersons = Math.max(0, numPersons - PERSON_COUNT_BASE_PERSONS);
            BigDecimal extraCost = room.getExtraPersonCost() == null
                    ? BigDecimal.ZERO : room.getExtraPersonCost();
            return room.getBaseRent24Hr().add(extraCost.multiply(BigDecimal.valueOf(extraPersons)));
        }
        return room.getBaseRent24Hr();
    }

    private String generateBookingNumber(String username) {
        Long seq = ((Number) entityManager
                .createNativeQuery("SELECT nextval('room_booking_seq')")
                .getSingleResult()).longValue();

        return "BN-" + initialsOf(username) + "-" + Year.now().getValue()
                + "-" + String.format("%07d", seq);
    }

    private String initialsOf(String username) {
        try {
            User user = authContextService.getLoggedInUser(username);
            String name = user.getName();
            if (name == null || name.isBlank()) return "X";
            String[] parts = name.trim().split("\\s+");
            if (parts.length == 1) {
                return parts[0].substring(0, 1).toUpperCase();
            }
            return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
        } catch (Exception e) {
            return "X";
        }
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

        // 1️⃣ Update extra charge if provided ("Extra Amount")
        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? booking.getExtraChargeAmount()
                : request.getExtraChargeAmount();

        booking.setExtraChargeAmount(extraCharge);

        // 2️⃣ Recalculate gross amount
        BigDecimal gross = booking.getBaseAmount().add(extraCharge);

        booking.setGrossAmount(gross);

        // 3️⃣ Penalty / deduction — CAN exceed deposit; reason required whenever > 0
        BigDecimal deduction = request.getDeductionFromDeposit() == null
                ? BigDecimal.ZERO
                : request.getDeductionFromDeposit();

        if (deduction.signum() > 0 &&
                (request.getPenaltyReason() == null || request.getPenaltyReason().isBlank())) {
            throw new RuntimeException("Reason for Penalty / Deduction is required");
        }

        booking.setDeductionFromDeposit(deduction);
        booking.setPenaltyReason(deduction.signum() > 0 ? request.getPenaltyReason() : null);

        // 4️⃣ Net cash to collect = Base + Extra Amount + Penalty − Deposit Collected
        BigDecimal deposit = booking.getSecurityDeposit() == null
                ? BigDecimal.ZERO : booking.getSecurityDeposit();
        BigDecimal netPayable = gross.add(deduction).subtract(deposit);
        booking.setNetPayableAmount(netPayable);

        // 5️⃣ Update checkout time
        booking.setActualCheckOutTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.CHECKED_OUT);

        // 6️⃣ Mark room as DIRTY
        Room room = booking.getRoom();
        room.setCleaningStatus(
                in.temple.backend.model.enums.CleaningStatus.DIRTY
        );

        // 7️⃣ Audit entry
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

        if (newRoom.getStatus() == in.temple.backend.model.enums.RoomStatus.MAINTENANCE) {
            throw new RuntimeException("Target room is under maintenance");
        }

        if (bookingRepository.existsByRoomIdAndStatus(newRoom.getId(), BookingStatus.CHECKED_IN)) {
            throw new RuntimeException("Target room is currently occupied");
        }

        // 3️⃣ Occupancy validation on target room (NA-strict rule via maxOccupancy)
        int numPersons = oldBooking.getNumPersons() == null ? 1 : oldBooking.getNumPersons();
        if (newRoom.getMaxOccupancy() != null && numPersons > newRoom.getMaxOccupancy()) {
            throw new RuntimeException(
                    "Number of persons (" + numPersons + ") exceeds target room's max occupancy ("
                            + newRoom.getMaxOccupancy() + ")"
            );
        }

        // 4️⃣ Settle old booking (manual adjustments) — no overlap/time check; no cap on bookings per room per day
        BigDecimal extraCharge = request.getExtraChargeAmount() == null
                ? oldBooking.getExtraChargeAmount()
                : request.getExtraChargeAmount();

        BigDecimal deduction = request.getDeductionFromDeposit() == null
                ? BigDecimal.ZERO
                : request.getDeductionFromDeposit();

        oldBooking.setExtraChargeAmount(extraCharge);

        BigDecimal gross = oldBooking.getBaseAmount().add(extraCharge);

        BigDecimal oldDeposit = oldBooking.getSecurityDeposit() == null
                ? BigDecimal.ZERO : oldBooking.getSecurityDeposit();

        oldBooking.setGrossAmount(gross);
        oldBooking.setNetPayableAmount(gross.add(deduction).subtract(oldDeposit));
        oldBooking.setDeductionFromDeposit(deduction);

        oldBooking.setActualCheckOutTime(LocalDateTime.now());
        oldBooking.setStatus(BookingStatus.ROOM_SHIFTED);

        // mark old room dirty
        oldBooking.getRoom()
                .setCleaningStatus(
                        in.temple.backend.model.enums.CleaningStatus.DIRTY
                );

        // 5️⃣ Carry forward remaining deposit, if any
        BigDecimal carryForwardDeposit = oldDeposit.subtract(deduction);
        if (carryForwardDeposit.signum() <= 0) {
            carryForwardDeposit = BigDecimal.ZERO;
        }

        // 6️⃣ Create new booking — same day-cycle window as the booking being shifted
        LocalDate bookingDate = oldBooking.getBookingDate() != null
                ? oldBooking.getBookingDate() : computeBookingDate(LocalDateTime.now());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime scheduledCheckOut = computeScheduledCheckOut(bookingDate);

        long existingCount = bookingRepository.countByRoomIdAndBookingDate(newRoom.getId(), bookingDate);
        int slotNumber = (int) existingCount + 1;

        String newBookingNumber = generateBookingNumber(request.getHandledBy());

        BigDecimal baseAmount = calculateBaseAmount(newRoom, numPersons);

        RoomBooking newBooking = RoomBooking.builder()
                .bookingNumber(newBookingNumber)
                .room(newRoom)
                .customerName(oldBooking.getCustomerName())
                .mobileNumber(oldBooking.getMobileNumber())
                .idProofType(oldBooking.getIdProofType())
                .idProofNumber(oldBooking.getIdProofNumber())
                .bookingType(BookingType.TWENTY_FOUR_HOUR)
                .numPersons(numPersons)
                .bookingDate(bookingDate)
                .slotNumber(slotNumber)
                .scheduledCheckIn(now)
                .scheduledCheckOut(scheduledCheckOut)
                .actualCheckInTime(now)
                .baseAmount(baseAmount)
                .extraSurchargeAmount(BigDecimal.ZERO)
                .extraChargeAmount(BigDecimal.ZERO)
                .grossAmount(baseAmount)
                .securityDeposit(carryForwardDeposit)
                .netPayableAmount(baseAmount)
                .status(BookingStatus.CHECKED_IN)
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

                    // 3️⃣ Check room_block table for date-range specific blocks
                    boolean blockedForPeriod = roomBlockRepository
                            .isRoomBlockedForPeriod(room.getId(), start, end);

                    // 4️⃣ MAINTENANCE rooms are never available
                    // Note: BLOCKED status on Room entity is no longer used for date-range blocks.
                    // Only room_block table determines availability for a given period.
                    boolean available = !occupied
                            && !blockedForPeriod
                            && room.getStatus() != in.temple.backend.model.enums.RoomStatus.MAINTENANCE;

                    return buildDto(room, available);

                })
                .toList();
    }

    private RoomAvailabilityDto buildDto(Room room, boolean available) {

        String blockedBy = null;
        String blockReason = null;
        String blockFrom = null;
        String blockTo = null;

        if (!available) {
            // Try room_block table first (accurate date-range source)
            var latestBlock = roomBlockRepository.findLatestActiveBlock(room.getId()).orElse(null);
            if (latestBlock != null) {
                blockedBy  = latestBlock.getBlockedBy();
                blockReason = latestBlock.getReason();
                java.time.format.DateTimeFormatter fmt =
                        java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
                blockFrom = latestBlock.getBlockFrom() != null ? latestBlock.getBlockFrom().format(fmt) : null;
                blockTo   = latestBlock.getBlockTo()   != null ? latestBlock.getBlockTo().format(fmt)   : null;
            } else {
                // Fallback: parse from audit log
                var blockAudit = roomAuditRepository.findLatestBlockAudit(room.getId()).orElse(null);
                if (blockAudit != null) {
                    blockedBy = blockAudit.getPerformedBy();
                    String details = blockAudit.getDetails();
                    if (details != null) {
                        if (details.contains("from ") && details.contains(" to ")) {
                            int fromIdx = details.indexOf("from ") + 5;
                            int toIdx   = details.indexOf(" to ");
                            blockFrom = details.substring(fromIdx, toIdx).trim();
                        }
                        if (details.contains(" to ") && details.contains(". Reason:")) {
                            int toIdx     = details.indexOf(" to ") + 4;
                            int reasonIdx = details.indexOf(". Reason:");
                            blockTo = details.substring(toIdx, reasonIdx).trim();
                        }
                        if (details.contains("Reason: ")) {
                            blockReason = details.substring(details.indexOf("Reason: ") + 8).trim();
                        }
                    }
                }
            }
        }

        return RoomAvailabilityDto.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .bhaktniwasBlockId(room.getBhaktniwasBlock().getId())
                .blockName(room.getBhaktniwasBlock().getDisplayName())
                .roomStatus(room.getStatus())
                .cleaningStatus(room.getCleaningStatus())
                .available(available)
                .blockedBy(blockedBy)
                .blockReason(blockReason)
                .blockFrom(blockFrom)
                .blockTo(blockTo)
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
                        .idProofType(rb.getIdProofType() == null ? null : rb.getIdProofType().name())
                        .idProofNumber(rb.getIdProofNumber())
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
    public List<DailySheetRoomDto> getDailySheet(Long bhaktniwasBlockId, LocalDate date) {

        List<Room> rooms = roomRepository
                .findByBhaktniwasBlock_IdAndIsActiveTrueOrderByRoomNumberAsc(bhaktniwasBlockId);

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        return rooms.stream().map(room -> {

            boolean maintenance = room.getStatus() == in.temple.backend.model.enums.RoomStatus.MAINTENANCE;

            var activeBlock = roomBlockRepository
                    .findActiveBlocksForPeriod(room.getId(), dayStart, dayEnd)
                    .stream()
                    .findFirst()
                    .orElse(null);
            boolean blocked = activeBlock != null;

            List<RoomBooking> bookings = bookingRepository
                    .findByRoomIdAndBookingDateOrderByActualCheckInTimeAsc(room.getId(), date);

            List<SlotDto> slots = new java.util.ArrayList<>();

            // Pending checkout carryover — a still-CHECKED_IN booking from an earlier bookingDate
            // must stay visible (flagged) on today's sheet until it's actually checked out.
            bookingRepository.findByRoomIdAndStatus(room.getId(), BookingStatus.CHECKED_IN).stream()
                    .filter(b -> b.getBookingDate() != null && b.getBookingDate().isBefore(date))
                    .findFirst()
                    .ifPresent(b -> slots.add(SlotDto.builder()
                            .slotNumber(0)
                            .status(b.getStatus().name())
                            .bookingNumber(b.getBookingNumber())
                            .guestName(b.getCustomerName())
                            .checkInTime(b.getActualCheckInTime())
                            .pending(true)
                            .build()));

            int slotNo = 0;
            for (RoomBooking b : bookings) {
                slotNo++;
                slots.add(SlotDto.builder()
                        .slotNumber(slotNo)
                        .status(b.getStatus().name())
                        .bookingNumber(b.getBookingNumber())
                        .guestName(b.getCustomerName())
                        .checkInTime(b.getActualCheckInTime())
                        .build());
            }

            // "Occupied + 1" rule — no trailing available slot when blocked/under maintenance
            if (!blocked && !maintenance) {
                slots.add(SlotDto.builder()
                        .slotNumber(slotNo + 1)
                        .status("AVAILABLE")
                        .build());
            }

            return DailySheetRoomDto.builder()
                    .roomId(room.getId())
                    .roomNumber(room.getRoomNumber())
                    .categoryName(room.getCategory().getName())
                    .cleaningStatus(room.getCleaningStatus() != null ? room.getCleaningStatus().name() : null)
                    .maxOccupancy(room.getMaxOccupancy())
                    .baseRent24Hr(room.getBaseRent24Hr())
                    .pricingType(room.getCategory().getPricingType() != null
                            ? room.getCategory().getPricingType().name() : null)
                    .extraPersonCost(room.getExtraPersonCost())
                    .blocked(blocked)
                    .blockedBy(activeBlock != null ? activeBlock.getBlockedBy() : null)
                    .blockReason(activeBlock != null ? activeBlock.getReason() : null)
                    .maintenance(maintenance)
                    .slots(slots)
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserCollectionReportDto getUserCollectionReport(String username, LocalDate date) {

        List<RoomBooking> bookings = bookingRepository.findByCreatedByAndBookingDate(username, date);

        List<UserCollectionRowDto> rows = bookings.stream()
                .map(b -> UserCollectionRowDto.builder()
                        .roomNumber(b.getRoom().getRoomNumber())
                        .bookingNumber(b.getBookingNumber())
                        .customerName(b.getCustomerName())
                        .numPersons(b.getNumPersons())
                        .checkIn(b.getActualCheckInTime())
                        .checkOut(b.getActualCheckOutTime())
                        .baseAmount(b.getBaseAmount())
                        .extraAmount(b.getExtraChargeAmount())
                        .penalty(b.getDeductionFromDeposit())
                        .netPayableAmount(b.getNetPayableAmount())
                        .status(b.getStatus())
                        .build())
                .toList();

        int totalPersons = bookings.stream()
                .mapToInt(b -> b.getNumPersons() == null ? 0 : b.getNumPersons())
                .sum();

        BigDecimal totalAmount = bookings.stream()
                .map(b -> b.getGrossAmount() == null ? BigDecimal.ZERO : b.getGrossAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserCollectionReportDto.builder()
                .username(username)
                .date(date)
                .totalBookings(bookings.size())
                .totalPersons(totalPersons)
                .totalAmount(totalAmount)
                .rows(rows)
                .build();
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
                .bhaktniwasBlockId(b.getRoom().getBhaktniwasBlock().getId())
                .blockName(b.getRoom().getBhaktniwasBlock().getDisplayName())
                .customerName(b.getCustomerName())
                .mobileNumber(b.getMobileNumber())
                .idProofType(b.getIdProofType())
                .idProofNumber(b.getIdProofNumber())
                .numPersons(b.getNumPersons())
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
    public byte[] printBookingReceipt(String bookingNumber, String language) {
        RoomBooking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingNumber));

        byte[] pdf = generateBookingReceiptPdf(booking, language);

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

    private byte[] generateBookingReceiptPdf(RoomBooking booking, String language) {
        boolean en = "en".equalsIgnoreCase(language);
        try {
            // AM/PM datetime formatter
            java.time.format.DateTimeFormatter dtFmt =
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a");

            String checkIn   = booking.getScheduledCheckIn()  != null ? booking.getScheduledCheckIn().format(dtFmt)  : "";
            String checkOut  = booking.getScheduledCheckOut() != null ? booking.getScheduledCheckOut().format(dtFmt)  : "";
            String createdOn = booking.getCreatedAt()         != null ? booking.getCreatedAt().format(dtFmt)          : "";

            Room room = booking.getRoom();
            String roomInfo = en
                    ? "Room " + room.getRoomNumber() + " - Block " + room.getBhaktniwasBlock().getDisplayName()
                    : "कक्ष " + room.getRoomNumber() + " - ब्लॉक " + room.getBhaktniwasBlock().getDisplayName();

            String grossAmt   = String.format("%,.0f", booking.getGrossAmount()    != null ? booking.getGrossAmount()    : java.math.BigDecimal.ZERO);
            String depositAmt = String.format("%,.0f", booking.getSecurityDeposit() != null ? booking.getSecurityDeposit() : java.math.BigDecimal.ZERO);

            // ── Font ──────────────────────────────────────────────────────────
            java.io.InputStream fontStream = getClass().getClassLoader()
                    .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf");
            if (fontStream == null)
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found");

            java.awt.Font baseFont = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, fontStream);
            fontStream.close();

            final int SCALE  = 3;
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

            final int CONTENT_W = W - 2 * M;
            int y = 90 * SCALE;

            // ── Title ─────────────────────────────────────────────────────────
            String title = en ? "Bhakt Niwas Booking Receipt" : "भक्त निवास बुकिंग रसीद";
            java.awt.font.TextLayout titleLayout =
                    new java.awt.font.TextLayout(title, fTitle, frc);
            int titleW = (int) titleLayout.getBounds().getWidth();
            int titleX = (W - titleW) / 2;
            titleLayout.draw(g, titleX, y);
            int titleBottom = y + (int) titleLayout.getDescent() + 2 * SCALE;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(titleX, titleBottom, titleX + titleW, titleBottom);
            y += (int) titleLayout.getBounds().getHeight() + 18 * SCALE;

            // ── Booking number & date ─────────────────────────────────────────
            drawBookingLine(g, (en ? "Receipt No: " : "रसीद क्रमांक: ") + booking.getBookingNumber(), M, y, fNormal, frc);
            drawBookingLine(g, (en ? "Date: " : "दिनांक: ") + createdOn, M + 200 * SCALE, y, fNormal, frc);
            y += LINE_H + 8 * SCALE;

            // ── Customer ──────────────────────────────────────────────────────
            y = drawBookingWrapped(g, (en ? "Guest Name: " : "अतिथि नाम: ") + booking.getCustomerName(),
                    M, y, CONTENT_W, fBold, frc, LINE_H);
            y += 4 * SCALE;
            drawBookingLine(g, (en ? "Mobile: " : "मोबाइल: ") + booking.getMobileNumber(), M, y, fNormal, frc);
            drawBookingLine(g, (en ? "ID Proof (" : "पहचान पत्र (") + booking.getIdProofType().name() + "): " + booking.getIdProofNumber(), M + 190 * SCALE, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Room details ──────────────────────────────────────────────────
            y = drawBookingWrapped(g, roomInfo, M, y, CONTENT_W, fBold, frc, LINE_H);
            y += 6 * SCALE;

            // Check-in and check-out on ONE line
            drawBookingLine(g, (en ? "Check-in: " : "चेक-इन: ") + checkIn, M, y, fNormal, frc);
            drawBookingLine(g, (en ? "Check-out: " : "चेक-आउट: ") + checkOut, M + 190 * SCALE, y, fNormal, frc);
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Amount table — left label, right-aligned amount ───────────────
            // col2X is the right edge for amounts — same as RIGHT
            drawBookingLine(g, en ? "Base Rent:" : "बेस किराया:", M, y, fNormal, frc);
            drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getBaseAmount() != null ? booking.getBaseAmount() : java.math.BigDecimal.ZERO), RIGHT, y, fNormal});
            y += LINE_H;

            if (booking.getExtraSurchargeAmount() != null && booking.getExtraSurchargeAmount().signum() > 0) {
                drawBookingLine(g, en ? "Extra Surcharge:" : "अतिरिक्त सरचार्ज:", M, y, fNormal, frc);
                drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getExtraSurchargeAmount()), RIGHT, y, fNormal});
                y += LINE_H;
            }

            if (booking.getExtraChargeAmount() != null && booking.getExtraChargeAmount().signum() > 0) {
                drawBookingLine(g, en ? "Extra Charge:" : "अतिरिक्त शुल्क:", M, y, fNormal, frc);
                drawRight.accept(new Object[]{"₹ " + String.format("%,.0f", booking.getExtraChargeAmount()), RIGHT, y, fNormal});
                y += LINE_H;
            }

            y += 6 * SCALE;
            // Subtotal rule — full width M to RIGHT
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 18 * SCALE;

            drawBookingLine(g, en ? "Total Amount:" : "कुल राशि:", M, y, fBold, frc);
            drawRight.accept(new Object[]{"₹ " + grossAmt + " /-", RIGHT, y, fBold});
            y += LINE_H;

            drawBookingLine(g, en ? "Security Deposit:" : "जमानत राशि:", M, y, fNormal, frc);
            drawRight.accept(new Object[]{"₹ " + depositAmt + " /-", RIGHT, y, fNormal});
            y += LINE_H + 4 * SCALE;

            // ── Horizontal rule ───────────────────────────────────────────────
            g.setStroke(new java.awt.BasicStroke(1.0f * SCALE));
            g.drawLine(M, y, RIGHT, y);
            y += 12 * SCALE;

            // ── Signatory ─────────────────────────────────────────────────────
            drawBookingLine(g, en ? "Received by:" : "प्राप्तकर्ता:", M, y, fNormal, frc);
            y += (int)(LINE_H * 1.5);
            drawBookingLine(g, booking.getCreatedBy(), M, y, fNormal, frc); y += LINE_H;
            drawBookingLine(g, en ? "Chamatkarik Shree Hanuman Mandir Sansthan" : "चमत्कारिक श्री हनुमान मंदिर संस्थान", M, y, fNormal, frc); y += LINE_H;
            drawBookingLine(g, en ? "(Hanuman Lok) Jamsawli" : "(हनुमान लोक) जामसावली", M, y, fNormal, frc);
            y += LINE_H + 14 * SCALE;

            // ── Terms & Conditions (below signatory, no HR above/below) ──────
            drawBookingLine(g, en ? "Terms & Conditions:" : "नियम एवं शर्तें:", M, y, fBold, frc);
            y += LINE_H + 2 * SCALE;
            y = drawBookingWrapped(g, en
                    ? "1. Booking is non-cancellable and non-refundable under any circumstances."
                    : "1. बुकिंग किसी भी परिस्थिति में रद्द नहीं होगी और कोई धनवापसी नहीं दी जाएगी।",
                    M, y, CONTENT_W, fTiny, frc, (int)(LINE_H * 0.95));
            y = drawBookingWrapped(g, en
                    ? "2. Late check-out is not acceptable under any circumstances."
                    : "2. देर से चेक-आउट किसी भी स्थिति में स्वीकार्य नहीं है।",
                    M, y, CONTENT_W, fTiny, frc, (int)(LINE_H * 0.95));
            y = drawBookingWrapped(g, en
                    ? "   Full day's charge will apply if the room is not vacated by 10 AM."
                    : "   प्रातः 10 बजे तक कक्ष खाली न करने पर पूर्ण दिन का शुल्क देय होगा।",
                    M, y, CONTENT_W, fTiny, frc, (int)(LINE_H * 0.95));
            y += LINE_H + 12 * SCALE - (int)(LINE_H * 0.95);

            // ── Footer ────────────────────────────────────────────────────────
            String footer = en
                    ? "Please present this receipt at the time of check-out."
                    : "कृपया चेक-आउट के समय यह रसीद प्रस्तुत करें।";
            java.awt.font.TextLayout tl = new java.awt.font.TextLayout(footer, fSmall, frc);
            int fx = (int)((W - tl.getBounds().getWidth()) / 2);
            drawBookingLine(g, footer, fx, y, fSmall, frc);
            y += LINE_H;
            g.setStroke(new java.awt.BasicStroke(1.5f * SCALE));
            g.drawLine(M, y, RIGHT, y);

            g.dispose();

            // ── PNG (lossless) → PDF ─────────────────────────────────────────────
            java.io.ByteArrayOutputStream imgOut = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "png", imgOut);

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

    /**
     * Draw text wrapped at word boundaries to fit maxWidth, instead of running
     * past the bitmap edge and getting silently clipped on print. Returns the
     * y position ready for the next line after the wrapped block.
     */
    private static int drawBookingWrapped(java.awt.Graphics2D g, String text, int x, int y, int maxWidth,
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

}
