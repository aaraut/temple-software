package in.temple.backend.service;

import in.temple.backend.dto.*;
import in.temple.backend.model.Donation;

import java.util.List;

public interface DonationService {

    DonationFormMetadataDto getFormMetadata();

    DonationResponseDto createDonation(
            DonationRequestDto request,
            String username);

    DonationResponseDto updateDonation(
            Long donationId,
            DonationUpdateRequestDto request,
            String username);

    List<DonationListItemDto> searchActiveDonations(
            DonationSearchRequestDto req
    );

    List<DonationListItemDto> searchInactiveDonations(
            DonationSearchRequestDto req
    );

    void changeDonationStatus(
            Long donationId,
            boolean active,
            String username
    );

    byte[] createDonationAndReturnReceiptPdf(
            DonationRequestDto req,
            String username);


    byte[] generateReceiptPdfById(Long id);

    Donation getDonationById(Long id);



}
