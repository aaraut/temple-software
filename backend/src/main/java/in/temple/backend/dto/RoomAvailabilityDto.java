package in.temple.backend.dto;

import in.temple.backend.model.enums.CleaningStatus;
import in.temple.backend.model.enums.RoomStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAvailabilityDto {

    private Long roomId;
    private String roomNumber;
    private String blockName;
    private RoomStatus roomStatus;
    private CleaningStatus cleaningStatus;
    private Boolean available;
}
