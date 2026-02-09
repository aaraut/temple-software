package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DonationReportRequestDto {

    private LocalDate fromDate;
    private LocalDate toDate;

    private Long purposeId;

    // ADMIN / SUPER_ADMIN only (ignored for USER)
    private String username;
}
