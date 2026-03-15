package in.temple.backend.dto;

import in.temple.backend.model.enums.BookingType;
import in.temple.backend.model.enums.IdProofType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    private BookingType bookingType;

    private LocalDateTime scheduledCheckIn;
    private LocalDateTime scheduledCheckOut;

    private BigDecimal extraSurchargeAmount;
    private BigDecimal extraChargeAmount;

    private BigDecimal securityDeposit;

    private String createdBy;
}
