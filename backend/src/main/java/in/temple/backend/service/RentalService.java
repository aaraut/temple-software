package in.temple.backend.service;

import in.temple.backend.dto.RentalDetailsResponseDto;
import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;
import in.temple.backend.dto.RentalSearchResultDto;

import java.util.List;

public interface RentalService {
    String issueRental(RentalIssueRequestDto request);
    void returnRental(RentalReturnRequestDto request);
    RentalDetailsResponseDto getRentalByReceipt(String receiptNumber);
    byte[] createRentalAndReturnReceiptPdf(RentalIssueRequestDto request, String username, String language);

    byte[] reprintReceipt(String receiptNumber, String language);
    byte[] returnRentalAndPrintReceipt(RentalReturnRequestDto request, String username, String language);
    List<RentalSearchResultDto> searchByMobile(String mobile);
    List<RentalSearchResultDto> searchByName(String name);
}
