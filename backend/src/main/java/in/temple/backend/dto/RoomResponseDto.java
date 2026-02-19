package in.temple.backend.dto;

import in.temple.backend.model.enums.CleaningStatus;
import in.temple.backend.model.enums.RoomStatus;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponseDto {

    private Long id;
    private String roomNumber;

    private Long categoryId;

    private String blockName;
    private String floor;
    private Integer maxOccupancy;

    private BigDecimal baseRent24Hr;
    private BigDecimal baseRentFixed;
    private BigDecimal baseRent3Hr;
    private BigDecimal baseRent6Hr;

    private BigDecimal defaultSecurityDeposit;

    private String remarks;

    private RoomStatus status;
    private CleaningStatus cleaningStatus;
}
