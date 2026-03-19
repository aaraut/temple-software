package in.temple.backend.service;

import in.temple.backend.dto.RentalDetailsResponseDto;
import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;

public interface RentalService {
    String issueRental(RentalIssueRequestDto request);
    void returnRental(RentalReturnRequestDto request);
    RentalDetailsResponseDto getRentalByReceipt(String receiptNumber);
    byte[] createRentalAndReturnReceiptPdf(
            RentalIssueRequestDto request,
            String username
    );

    byte[] returnRentalAndPrintReceipt(
            RentalReturnRequestDto request,
            String username
    );

}
