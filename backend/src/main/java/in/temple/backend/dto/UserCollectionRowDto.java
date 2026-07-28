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
public class UserCollectionRowDto {
    private String roomNumber;
    private String bookingNumber;
    private String customerName;
    private Integer numPersons;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private BigDecimal baseAmount;
    private BigDecimal extraAmount;
    private BigDecimal penalty;
    private BigDecimal netPayableAmount;
    private BookingStatus status;
}
