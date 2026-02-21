package in.temple.backend.dto;

import in.temple.backend.model.enums.BookingStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBookingSearchRequestDto {

    private String bookingNumber;
    private String customerName;
    private String mobileNumber;
    private BookingStatus status;

    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
