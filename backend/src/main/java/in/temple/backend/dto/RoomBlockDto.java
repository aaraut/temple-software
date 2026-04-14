package in.temple.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBlockDto {
    private Long roomId;
    private String roomNumber;
    private LocalDateTime blockFrom;
    private LocalDateTime blockTo;
    private String reason;
    private String blockedBy;
}
