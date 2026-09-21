package in.temple.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DonationRequestDto {

    @NotBlank
    @Size(max = 255)
    private String donorName;

    @NotBlank
    @Size(max = 500)
    private String address;

    @NotBlank
    @Size(min = 10, max = 10)
    private String mobile;

    @NotNull
    private Long purposeId;

    @NotNull
    private BigDecimal amount;

    private String paymentType; // CASH
    private String gotraId;     // String ID (English name)
}
