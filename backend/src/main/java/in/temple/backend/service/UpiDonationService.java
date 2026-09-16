package in.temple.backend.service;

import in.temple.backend.dto.UpiDonationListItemDto;
import in.temple.backend.dto.UpiDonationRequestDto;
import in.temple.backend.dto.UpiDonationSearchRequestDto;

import java.util.List;

public interface UpiDonationService {

    byte[] createAndReturnReceiptPdf(UpiDonationRequestDto req, String username, String language);

    byte[] generateReceiptPdfById(Long id, String language);

    List<UpiDonationListItemDto> search(UpiDonationSearchRequestDto req);
}
