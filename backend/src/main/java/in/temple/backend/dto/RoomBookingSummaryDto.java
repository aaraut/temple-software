package in.temple.backend.dto;

import in.temple.backend.model.enums.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBookingSummaryDto {

    private String bookingNumber;
    private String roomNumber;
    private String customerName;
    private String mobileNumber;
    private BookingStatus status;
    private LocalDateTime scheduledCheckIn;
    private LocalDateTime scheduledCheckOut;
    private BigDecimal grossAmount;
}
