package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DonationSummaryDTO {

    private String purpose;
    private String purposeHi;
    private Long receiptCount;
    private BigDecimal amount;
}
