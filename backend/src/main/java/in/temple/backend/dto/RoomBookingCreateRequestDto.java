package in.temple.backend.dto;

import in.temple.backend.model.enums.IdProofType;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBookingCreateRequestDto {

    private Long roomId;

    private String customerName;
    private String mobileNumber;

    private IdProofType idProofType;
    private String idProofNumber;

    private Integer numPersons;

    private BigDecimal extraChargeAmount;   // UI label: "Extra Amount"

    private BigDecimal securityDeposit;

    private String createdBy;
}
