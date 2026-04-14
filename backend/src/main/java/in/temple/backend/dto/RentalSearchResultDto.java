package in.temple.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RentalSearchResultDto {
    private String receiptNumber;
    private String customerName;
    private String mobile;
    private String address;
    private String category;
    private String status;
    private LocalDateTime createdAt;
}
