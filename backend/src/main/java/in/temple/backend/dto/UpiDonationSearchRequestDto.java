package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpiDonationSearchRequestDto {
    private String mobile;
    private String receiptNumber;
}
