package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySheetRoomDto {
    private Long roomId;
    private String roomNumber;
    private String categoryName;
    private String cleaningStatus;

    private Integer maxOccupancy;
    private BigDecimal baseRent24Hr;
    private String pricingType;
    private BigDecimal extraPersonCost;

    private boolean blocked;
    private String blockedBy;
    private String blockReason;

    private boolean maintenance;

    private List<SlotDto> slots;
}
