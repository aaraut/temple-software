package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomShiftRequestDto {

    private String oldBookingNumber;

    private Long newRoomId;

    private LocalDateTime newScheduledCheckIn;
    private LocalDateTime newScheduledCheckOut;

    private BigDecimal extraChargeAmount;      // adjustment before shift
    private BigDecimal deductionFromDeposit;   // damage deduction

    private String handledBy;
}
