package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class UpiDonationListItemDto {
    private Long id;
    private String receiptNumber;
    private String donorName;
    private String mobile;
    private String purposeNameEn;
    private String purposeNameHi;
    private BigDecimal amount;
    private String paymentRefLast4;
    private LocalDateTime createdAt;
}
