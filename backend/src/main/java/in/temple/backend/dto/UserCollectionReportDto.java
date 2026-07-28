package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCollectionReportDto {
    private String username;
    private LocalDate date;
    private int totalBookings;
    private int totalPersons;
    private BigDecimal totalAmount;
    private List<UserCollectionRowDto> rows;
}
