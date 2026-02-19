package in.temple.backend.dto;

import in.temple.backend.model.enums.CleaningStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CleaningStatusUpdateDto {

    private CleaningStatus cleaningStatus;
    private String handledBy;
}

