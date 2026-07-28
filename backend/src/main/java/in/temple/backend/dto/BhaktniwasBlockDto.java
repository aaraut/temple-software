package in.temple.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BhaktniwasBlockDto {
    private Long id;
    private String code;
    private String displayName;
    private Integer sortOrder;
}
