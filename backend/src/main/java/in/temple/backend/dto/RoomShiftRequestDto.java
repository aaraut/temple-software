package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomShiftRequestDto {

    private String oldBookingNumber;

    private Long newRoomId;

    private BigDecimal extraChargeAmount;      // adjustment before shift
    private BigDecimal deductionFromDeposit;   // damage deduction

    private String handledBy;
}
