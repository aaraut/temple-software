package in.temple.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpiDonationRequestDto {

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

    @NotBlank
    @Size(min = 4, max = 4)
    private String paymentRefLast4;

    private String gotraId;
}
