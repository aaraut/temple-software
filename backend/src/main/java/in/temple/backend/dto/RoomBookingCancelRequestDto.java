package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBookingCancelRequestDto {

    private String bookingNumber;

    private BigDecimal cancellationCharge;

    private String remarks;

    private String handledBy;
}