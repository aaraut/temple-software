package in.temple.backend.service.impl;

import in.temple.backend.dto.CleaningStatusUpdateDto;
import in.temple.backend.dto.RoomCreateRequestDto;
import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.*;
import in.temple.backend.repository.*;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.RoomService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import in.temple.backend.dto.RoomBlockRequestDto;
import in.temple.backend.dto.RoomBlockResultDto;
import in.temple.backend.dto.RoomResponseDto;
import in.temple.backend.repository.RoomBookingRepository;
import in.temple.backend.repository.RoomBlockRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomCategoryRepository categoryRepository;
    private final AmenityRepository amenityRepository;
    private final RoomAmenityRepository roomAmenityRepository;
    private final RoomAuditRepository roomAuditRepository;
    private final RoomBookingRepository bookingRepository;
    private final RoomBlockRepository roomBlockRepository;



    @Override
    @Transactional
    public RoomResponseDto createRoom(RoomCreateRequestDto request) {

        if (roomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new RuntimeException("Room number already exists");
        }

        RoomCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() ->
                        new NotFoundException("Room category not found with id: " + request.getCategoryId())
                );

        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .category(category)
                .blockName(request.getBlockName())
                .floor(request.getFloor())
                .maxOccupancy(request.getMaxOccupancy())
                .baseRent24Hr(request.getBaseRent24Hr())
                .baseRentFixed(request.getBaseRentFixed())
                .baseRent3Hr(request.getBaseRent3Hr())
                .baseRent6Hr(request.getBaseRent6Hr())
                .defaultSecurityDeposit(request.getDefaultSecurityDeposit())
                .remarks(request.getRemarks())
                .isActive(true)
                .build();

        Room savedRoom = roomRepository.save(room);

        // Audit entry (aligned with rental style)
        roomAuditRepository.save(
                RoomAudit.builder()
                        .roomId(savedRoom.getId())
                        .action("CREATE")
                        .details("Room created: " + savedRoom.getRoomNumber())
                        .performedBy(request.getCreatedBy())
                        .build()
        );

        return mapToDto(savedRoom);
    }


    @Override
    public List<RoomResponseDto> getAllRooms() {
        return roomRepository.findByIsActiveTrue()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private RoomResponseDto mapToDto(Room room) {
        return RoomResponseDto.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .categoryId(room.getCategory().getId())
                .blockName(room.getBlockName())
                .floor(room.getFloor())
                .maxOccupancy(room.getMaxOccupancy())
                .baseRent24Hr(room.getBaseRent24Hr())
                .baseRentFixed(room.getBaseRentFixed())
                .baseRent3Hr(room.getBaseRent3Hr())
                .baseRent6Hr(room.getBaseRent6Hr())
                .defaultSecurityDeposit(room.getDefaultSecurityDeposit())
                .remarks(room.getRemarks())
                .status(room.getStatus())
                .cleaningStatus(room.getCleaningStatus())
                .build();
    }


    @Override
    @Transactional
    public RoomResponseDto updateRoom(Long roomId, RoomCreateRequestDto request) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() ->
                        new NotFoundException("Room not found with id: " + roomId)
                );

        RoomCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() ->
                        new NotFoundException("Room category not found with id: " + request.getCategoryId())
                );

        room.setRoomNumber(request.getRoomNumber());
        room.setCategory(category);
        room.setBlockName(request.getBlockName());
        room.setFloor(request.getFloor());
        room.setMaxOccupancy(request.getMaxOccupancy());
        room.setBaseRent24Hr(request.getBaseRent24Hr());
        room.setBaseRentFixed(request.getBaseRentFixed());
        room.setBaseRent3Hr(request.getBaseRent3Hr());
        room.setBaseRent6Hr(request.getBaseRent6Hr());
        room.setDefaultSecurityDeposit(request.getDefaultSecurityDeposit());
        room.setRemarks(request.getRemarks());

        roomRepository.save(room);

        roomAuditRepository.save(
                RoomAudit.builder()
                        .roomId(room.getId())
                        .action("UPDATE")
                        .details("Room updated: " + room.getRoomNumber())
                        .performedBy(request.getCreatedBy())
                        .build()
        );

        return mapToDto(room);
    }

    @Override
    @Transactional
    public void updateCleaningStatus(Long roomId, CleaningStatusUpdateDto request) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() ->
                        new NotFoundException("Room not found with id: " + roomId)
                );

        room.setCleaningStatus(request.getCleaningStatus());

        roomAuditRepository.save(
                RoomAudit.builder()
                        .roomId(room.getId())
                        .action("CLEANING_STATUS_UPDATE")
                        .details("Cleaning status changed to: " + request.getCleaningStatus())
                        .performedBy(request.getHandledBy())
                        .build()
        );
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId, String deletedBy) {

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() ->
                        new NotFoundException("Room not found with id: " + roomId)
                );

        room.setIsActive(false);

        roomAuditRepository.save(
                RoomAudit.builder()
                        .roomId(room.getId())
                        .action("DELETE")
                        .details("Room soft deleted: " + room.getRoomNumber())
                        .performedBy(deletedBy)
                        .build()
        );
    }


    @Override
    @jakarta.transaction.Transactional
    public RoomBlockResultDto blockRooms(RoomBlockRequestDto request) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

        List<in.temple.backend.model.Room> targets =
                (request.getRoomIds() == null || request.getRoomIds().isEmpty())
                        ? roomRepository.findByIsActiveTrue()
                        : roomRepository.findAllById(request.getRoomIds());

        List<RoomBlockResultDto.ConflictDto> conflicts = new ArrayList<>();
        int blocked = 0;

        for (in.temple.backend.model.Room room : targets) {
            boolean hasConflict = bookingRepository.existsOverlappingBooking(
                    room.getId(),
                    List.of(
                            in.temple.backend.model.enums.BookingStatus.BOOKED,
                            in.temple.backend.model.enums.BookingStatus.CHECKED_IN
                    ),
                    request.getBlockFrom(),
                    request.getBlockTo()
            );

            if (hasConflict) {
                bookingRepository.findByRoomIdAndStatusIn(
                                room.getId(),
                                List.of(
                                        in.temple.backend.model.enums.BookingStatus.BOOKED,
                                        in.temple.backend.model.enums.BookingStatus.CHECKED_IN
                                )
                        ).stream()
                        .filter(b -> b.getScheduledCheckOut().isAfter(request.getBlockFrom())
                                && b.getScheduledCheckIn().isBefore(request.getBlockTo()))
                        .forEach(b -> conflicts.add(
                                RoomBlockResultDto.ConflictDto.builder()
                                        .roomId(room.getId())
                                        .roomNumber(room.getRoomNumber())
                                        .blockName(room.getBlockName())
                                        .bookingNumber(b.getBookingNumber())
                                        .customerName(b.getCustomerName())
                                        .mobileNumber(b.getMobileNumber())
                                        .status(b.getStatus().name())
                                        .scheduledCheckIn(b.getScheduledCheckIn().format(fmt))
                                        .scheduledCheckOut(b.getScheduledCheckOut().format(fmt))
                                        .build()
                        ));
            } else {
                roomBlockRepository.save(
                        in.temple.backend.model.RoomBlock.builder()
                                .roomId(room.getId())
                                .blockFrom(request.getBlockFrom())
                                .blockTo(request.getBlockTo())
                                .reason(request.getReason() != null ? request.getReason() : "Festival/Event")
                                .blockedBy(request.getBlockedBy())
                                .active(true)
                                .build()
                );
                // Do NOT change room.status — block is date-range only via room_block table
                roomAuditRepository.save(
                        in.temple.backend.model.RoomAudit.builder()
                                .roomId(room.getId())
                                .action("BLOCKED")
                                .details(String.format("Blocked from %s to %s. Reason: %s",
                                        request.getBlockFrom().format(fmt),
                                        request.getBlockTo().format(fmt),
                                        request.getReason() != null ? request.getReason() : "Festival/Event"))
                                .performedBy(request.getBlockedBy())
                                .build()
                );
                log.info("ROOM BLOCKED | room={} | from={} | to={} | by={}",
                        room.getRoomNumber(), request.getBlockFrom(), request.getBlockTo(), request.getBlockedBy());
                blocked++;
            }
        }

        return RoomBlockResultDto.builder()
                .blockedCount(blocked)
                .skippedCount(conflicts.size())
                .conflicts(conflicts)
                .build();
    }

    @Override
    @jakarta.transaction.Transactional
    public void unblockRooms(RoomBlockRequestDto request) {
        List<Long> roomIds   = request.getRoomIds();
        LocalDateTime from   = request.getUnblockFrom();
        LocalDateTime to     = request.getUnblockTo();
        String unblockedBy   = request.getUnblockedBy();

        List<in.temple.backend.model.Room> rooms =
                (roomIds == null || roomIds.isEmpty())
                        ? roomRepository.findByIsActiveTrue()
                        : roomRepository.findAllById(roomIds);

        List<Long> targetIds = rooms.stream().map(in.temple.backend.model.Room::getId).toList();

        roomBlockRepository.deactivateBlocksForPeriod(targetIds, from, to);

        for (in.temple.backend.model.Room room : rooms) {
            // room.status is always AVAILABLE — blocking is date-range only via room_block table
            roomAuditRepository.save(
                    in.temple.backend.model.RoomAudit.builder()
                            .roomId(room.getId())
                            .action("UNBLOCKED")
                            .details(String.format("Unblocked period %s to %s by %s", from, to, unblockedBy))
                            .performedBy(unblockedBy)
                            .build()
            );
            log.info("ROOM UNBLOCKED | room={} | from={} | to={} | by={}", room.getRoomNumber(), from, to, unblockedBy);
        }
    }

    @Override
    public java.util.List<in.temple.backend.dto.RoomBlockDto> getActiveBlocksForMonth(String month) {
        String[] parts = month.split("-");
        int year = Integer.parseInt(parts[0]);
        int mo   = Integer.parseInt(parts[1]);
        LocalDateTime monthStart = LocalDateTime.of(year, mo, 1, 0, 0);
        LocalDateTime monthEnd   = monthStart.plusMonths(1).minusSeconds(1);

        return roomBlockRepository.findAll().stream()
                .filter(rb -> rb.isActive()
                        && rb.getBlockFrom().isBefore(monthEnd)
                        && rb.getBlockTo().isAfter(monthStart))
                .map(rb -> {
                    in.temple.backend.model.Room room = roomRepository.findById(rb.getRoomId()).orElse(null);
                    return in.temple.backend.dto.RoomBlockDto.builder()
                            .roomId(rb.getRoomId())
                            .roomNumber(room != null ? room.getRoomNumber() : "?")
                            .blockFrom(rb.getBlockFrom())
                            .blockTo(rb.getBlockTo())
                            .reason(rb.getReason())
                            .blockedBy(rb.getBlockedBy())
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

}
