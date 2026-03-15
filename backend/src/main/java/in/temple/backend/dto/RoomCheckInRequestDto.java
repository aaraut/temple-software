package in.temple.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCheckInRequestDto {

    private String bookingNumber;

    private String handledBy;
}
