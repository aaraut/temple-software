package in.temple.backend.controller;

import in.temple.backend.dto.BhaktniwasBlockDto;
import in.temple.backend.dto.DailySheetRoomDto;
import in.temple.backend.repository.BhaktniwasBlockRepository;
import in.temple.backend.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bhaktniwas")
@RequiredArgsConstructor
public class BhaktniwasBlockController {

    private final BhaktniwasBlockRepository bhaktniwasBlockRepository;
    private final RoomBookingService roomBookingService;

    @GetMapping("/blocks")
    public List<BhaktniwasBlockDto> getActiveBlocks() {
        return bhaktniwasBlockRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(b -> BhaktniwasBlockDto.builder()
                        .id(b.getId())
                        .code(b.getCode())
                        .displayName(b.getDisplayName())
                        .sortOrder(b.getSortOrder())
                        .build())
                .toList();
    }

    @GetMapping("/{blockId}/daily-sheet")
    public List<DailySheetRoomDto> getDailySheet(
            @PathVariable Long blockId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return roomBookingService.getDailySheet(blockId, date != null ? date : LocalDate.now());
    }
}
