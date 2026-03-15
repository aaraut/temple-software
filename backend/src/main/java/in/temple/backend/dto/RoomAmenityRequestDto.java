package in.temple.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAmenityRequestDto {

    private Long amenityId;

    private Integer quantity;
}
