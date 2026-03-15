package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class AdminRentalSummaryDto {

    private BigDecimal totalCalculatedAmount;
    private BigDecimal totalChargedAmount;
    private BigDecimal totalDiscountAmount;

    private BigDecimal totalFineCollected;

    private BigDecimal depositCollected;
    private BigDecimal depositRefunded;
    private BigDecimal depositPending;

    private List<UserBreakdown> userBreakdown;

    @Getter
    @Setter
    public static class UserBreakdown {
        private String createdBy;
        private Integer totalRentals;
        private BigDecimal calculatedAmount;
        private BigDecimal chargedAmount;
        private BigDecimal discountAmount;
        private BigDecimal fineCollected;
    }
}
