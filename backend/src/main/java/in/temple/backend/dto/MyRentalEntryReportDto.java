package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class MyRentalEntryReportDto {

    private String receiptNumber;
    private LocalDateTime createdAt;
    private String category;

    private String customerName;
    private String mobile;

    private Integer totalIssuedQty;
    private Integer totalPendingQty;

    private BigDecimal calculatedAmount;
    private BigDecimal chargedAmount;
    private BigDecimal discountAmount;

    private BigDecimal depositAmount;
    private BigDecimal totalFineAmount;

    private String status;
}
