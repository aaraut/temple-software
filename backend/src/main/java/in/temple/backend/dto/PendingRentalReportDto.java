package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class PendingRentalReportDto {

    private String receiptNumber;
    private LocalDateTime createdAt;
    private String category;

    private String customerName;
    private String mobile;
    private String createdBy;

    private Integer totalIssuedQty;
    private Integer totalPendingQty;

    private BigDecimal depositAmount;
    private BigDecimal totalFineAmount;
    private String status;
}
