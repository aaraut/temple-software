package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RentalSummaryDTO {

    private Long transactions;
    private BigDecimal rentTotal;
    private BigDecimal depositTotal;
}