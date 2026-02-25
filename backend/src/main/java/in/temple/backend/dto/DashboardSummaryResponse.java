package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardSummaryResponse {

    private List<DonationSummaryDTO> donations;

    private RentalSummaryDTO rentalBartan;
    private RentalSummaryDTO rentalBichayat;

    private BigDecimal collectionTotal;
    private BigDecimal depositTotal;

    private SummaryItem goshalaDaan;
}