package in.temple.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBlockRequestDto {

    // null or empty = all active rooms
    private List<Long> roomIds;

    // For block action
    private LocalDateTime blockFrom;
    private LocalDateTime blockTo;
    private String reason;
    private String blockedBy;

    // For unblock action
    private LocalDateTime unblockFrom;
    private LocalDateTime unblockTo;
    private String unblockedBy;
}
