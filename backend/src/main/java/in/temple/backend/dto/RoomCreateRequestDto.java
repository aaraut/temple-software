package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCreateRequestDto {

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

    private List<RoomAmenityRequestDto> amenities;

    private String createdBy;

}
