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
import org.springframework.stereotype.Service;
import in.temple.backend.dto.RoomResponseDto;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final RoomCategoryRepository categoryRepository;
    private final AmenityRepository amenityRepository;
    private final RoomAmenityRepository roomAmenityRepository;

    private final RoomAuditRepository roomAuditRepository;



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




}
