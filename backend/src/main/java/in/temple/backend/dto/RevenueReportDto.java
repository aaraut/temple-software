package in.temple.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class RevenueReportDto {

    private BigDecimal totalRent;
    private BigDecimal totalDepositCollected;
    private BigDecimal totalDepositRefunded;
    private BigDecimal totalCancellationCharge;
    private BigDecimal netCash;
}