package in.temple.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotDto {
    private int slotNumber;
    private String status;          // AVAILABLE | CHECKED_IN | CHECKED_OUT | ROOM_SHIFTED | CANCELLED
    private String bookingNumber;
    private String guestName;
    private LocalDateTime checkInTime;

    /** True when this is a still-checked-in booking carried over from an earlier bookingDate —
     *  i.e. checkout is overdue and this needs to stay visible on "today" until resolved. */
    private boolean pending;
}
