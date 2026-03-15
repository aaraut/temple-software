package in.temple.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OccupancyReportDto {
    private Long totalRooms;
    private Long occupiedRooms;
    private Double occupancyPercentage;
}
