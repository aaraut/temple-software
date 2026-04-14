package in.temple.backend.dto;

import in.temple.backend.model.enums.BookingStatus;
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
public class RoomBookingDetailDto {

    private String bookingNumber;

    // Room
    private Long roomId;
    private String roomNumber;
    private String blockName;

    // Customer
    private String customerName;
    private String mobileNumber;
    private IdProofType idProofType;
    private String idProofNumber;

    // Booking
    private BookingType bookingType;
    private BookingStatus status;
    private LocalDateTime scheduledCheckIn;
    private LocalDateTime scheduledCheckOut;
    private LocalDateTime actualCheckInTime;
    private LocalDateTime actualCheckOutTime;

    // Amounts
    private BigDecimal baseAmount;
    private BigDecimal extraSurchargeAmount;
    private BigDecimal extraChargeAmount;
    private BigDecimal grossAmount;
    private BigDecimal securityDeposit;
    private BigDecimal netPayableAmount;

    private String createdBy;
    private LocalDateTime createdAt;
}
