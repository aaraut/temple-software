package in.temple.backend.controller;

import in.temple.backend.dto.*;
import in.temple.backend.model.Donation;
import in.temple.backend.service.DonationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donation")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    @GetMapping("/form-metadata")
    public ResponseEntity<DonationFormMetadataDto> loadForm() {
        return ResponseEntity.ok(donationService.getFormMetadata());
    }

    @PostMapping
    public ResponseEntity<DonationResponseDto> submit(
            @RequestBody DonationRequestDto request,
            @RequestParam String username) {

        return ResponseEntity.ok(
                donationService.createDonation(request, username)
        );
    }

    @PutMapping("/{donationId}")
    public ResponseEntity<DonationResponseDto> update(
            @PathVariable Long donationId,
            @RequestBody DonationUpdateRequestDto request,
            @RequestParam String username) {

        return ResponseEntity.ok(
                donationService.updateDonation(donationId, request, username)
        );
    }

    @PostMapping("/search")
    public List<DonationListItemDto> search(
            @RequestBody DonationSearchRequestDto req) {
        return donationService.searchActiveDonations(req);
    }

    @PostMapping("/search-inactive")
    public List<DonationListItemDto> searchInactive(
            @RequestBody DonationSearchRequestDto req) {
        return donationService.searchInactiveDonations(req);
    }

    @PutMapping("/{donationId}/status")
    public ResponseEntity<Void> changeStatus(
            @PathVariable Long donationId,
            @RequestParam boolean active,
            @RequestParam String username) {

        donationService.changeDonationStatus(
                donationId,
                active,
                username
        );

        return ResponseEntity.ok().build();
    }

    @PostMapping(
            value = "/create-and-print",
            produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> createAndPrint(
            @RequestBody DonationRequestDto request,
            @RequestParam String username) {

        byte[] pdf =
                donationService.createDonationAndReturnReceiptPdf(
                        request,
                        username
                );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=receipt.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping(value = "/{id}/print", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> reprint(@PathVariable Long id) {

        byte[] pdf = donationService.generateReceiptPdfById(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=receipt-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}")
    public Donation getById(@PathVariable Long id) {
        return donationService.getDonationById(id);
    }




}
