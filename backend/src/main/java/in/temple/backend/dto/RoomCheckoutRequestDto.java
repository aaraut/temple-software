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

    private BigDecimal extraChargeAmount;      // UI label: "Extra Amount"
    private BigDecimal deductionFromDeposit;   // UI label: "Penalty / Deduction"; can exceed deposit
    private String penaltyReason;              // required server-side when deductionFromDeposit > 0

    private String remarks;

    private String handledBy;
}
