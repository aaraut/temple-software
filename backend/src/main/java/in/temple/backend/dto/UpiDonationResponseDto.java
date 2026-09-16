package in.temple.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UpiDonationResponseDto {
    private Long upiDonationId;
    private String receiptNumber;
    private String status;
}
