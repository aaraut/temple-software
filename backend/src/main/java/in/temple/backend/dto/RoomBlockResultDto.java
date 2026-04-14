package in.temple.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBlockResultDto {

    private int blockedCount;
    private int skippedCount;          // rooms that could not be blocked (active bookings)
    private List<ConflictDto> conflicts;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConflictDto {
        private Long roomId;
        private String roomNumber;
        private String blockName;
        private String bookingNumber;
        private String customerName;
        private String mobileNumber;
        private String status;
        private String scheduledCheckIn;
        private String scheduledCheckOut;
    }
}
