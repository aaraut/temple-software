package in.temple.backend.controller;

import in.temple.backend.dto.CleaningStatusUpdateDto;
import in.temple.backend.dto.RoomBlockRequestDto;
import in.temple.backend.dto.RoomBlockResultDto;
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

    @PostMapping("/block")
    public RoomBlockResultDto blockRooms(@RequestBody RoomBlockRequestDto request) {
        return roomService.blockRooms(request);
    }

    @PostMapping("/unblock")
    public void unblockRooms(@RequestBody RoomBlockRequestDto request) {
        roomService.unblockRooms(request);
    }

    @GetMapping("/blocks")
    public java.util.List<in.temple.backend.dto.RoomBlockDto> getActiveBlocks(
            @org.springframework.web.bind.annotation.RequestParam String month) {
        // month = "2026-04"
        return roomService.getActiveBlocksForMonth(month);
    }

}