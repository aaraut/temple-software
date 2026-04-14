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
    byte[] createRentalAndReturnReceiptPdf(RentalIssueRequestDto request, String username);

    byte[] reprintReceipt(String receiptNumber);
    byte[] returnRentalAndPrintReceipt(RentalReturnRequestDto request, String username);
    List<RentalSearchResultDto> searchByMobile(String mobile);
    List<RentalSearchResultDto> searchByName(String name);
}
