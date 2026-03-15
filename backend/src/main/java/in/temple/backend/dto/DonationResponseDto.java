package in.temple.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DonationResponseDto {
    private Long donationId;
    private String receiptNumber;
    private String status;
}
