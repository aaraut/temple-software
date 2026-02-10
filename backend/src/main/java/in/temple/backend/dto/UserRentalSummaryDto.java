package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UserRentalSummaryDto {

    private Integer totalRentals;
    private Integer closedRentals;
    private Integer pendingRentals;

    private BigDecimal totalCalculatedAmount;
    private BigDecimal totalChargedAmount;
    private BigDecimal totalDiscountAmount;

    private BigDecimal totalFineCollected;

    private BigDecimal depositCollected;
    private BigDecimal depositRefunded;
    private BigDecimal depositPending;
}
