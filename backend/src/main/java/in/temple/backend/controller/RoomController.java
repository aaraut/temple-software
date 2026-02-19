package in.temple.backend.controller;

import in.temple.backend.dto.CleaningStatusUpdateDto;
import in.temple.backend.dto.RoomCreateRequestDto;
import in.temple.backend.dto.RoomResponseDto;
import in.temple.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public RoomResponseDto createRoom(@RequestBody RoomCreateRequestDto request) {
        return roomService.createRoom(request);
    }

    @GetMapping
    public List<RoomResponseDto> getAllRooms() {
        return roomService.getAllRooms();
    }

    @PatchMapping("/{id}/cleaning-status")
    public void updateCleaningStatus(
            @PathVariable Long id,
            @RequestBody CleaningStatusUpdateDto request) {
        roomService.updateCleaningStatus(id, request);
    }

    @PutMapping("/{id}")
    public RoomResponseDto updateRoom(
            @PathVariable Long id,
            @RequestBody RoomCreateRequestDto request) {
        return roomService.updateRoom(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteRoom(
            @PathVariable Long id,
            @RequestParam String deletedBy) {
        roomService.deleteRoom(id, deletedBy);
    }


}
