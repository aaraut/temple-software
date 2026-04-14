package in.temple.backend.service;

import in.temple.backend.dto.CleaningStatusUpdateDto;
import in.temple.backend.dto.RoomBlockDto;
import in.temple.backend.dto.RoomBlockRequestDto;
import in.temple.backend.dto.RoomBlockResultDto;
import in.temple.backend.dto.RoomCreateRequestDto;
import in.temple.backend.dto.RoomResponseDto;
import in.temple.backend.model.enums.CleaningStatus;

import java.util.List;

public interface RoomService {

    RoomResponseDto createRoom(RoomCreateRequestDto request);

    List<RoomResponseDto> getAllRooms();

    RoomResponseDto updateRoom(Long roomId, RoomCreateRequestDto request);

    void updateCleaningStatus(Long roomId, CleaningStatusUpdateDto request);

    void deleteRoom(Long roomId, String deletedBy);

    RoomBlockResultDto blockRooms(RoomBlockRequestDto request);

    void unblockRooms(RoomBlockRequestDto request);

    java.util.List<RoomBlockDto> getActiveBlocksForMonth(String month);

}
