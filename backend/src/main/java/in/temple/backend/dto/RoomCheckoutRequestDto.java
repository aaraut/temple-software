package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCheckoutRequestDto {

    private String bookingNumber;

    private BigDecimal extraChargeAmount;      // optional update
    private BigDecimal deductionFromDeposit;   // damage / missing

    private String remarks;

    private String handledBy;
}
