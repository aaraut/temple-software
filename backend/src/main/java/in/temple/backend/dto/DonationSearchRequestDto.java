package in.temple.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DonationSearchRequestDto {

    private String receiptNumber;
    private String mobile;
    private LocalDate fromDate;
    private LocalDate toDate;
    private String purposeNameEn;
    private String createdBy;
    private String donorName;
}
