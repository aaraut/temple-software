package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DonationUpdateRequestDto {

    private String donorName;
    private String address;
    private String mobile;
    private Long purposeId;
    private BigDecimal amount;
    private String gotraId;
}
