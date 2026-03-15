package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationListItemDto {

    private Long id;
    private String receiptNumber;
    private String donorName;
    private String mobile;
    private String purposeNameEn;
    private String purposeNameHi;
    private BigDecimal amount;
    private LocalDateTime createdAt;
}
