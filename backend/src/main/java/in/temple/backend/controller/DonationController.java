package in.temple.backend.controller;

import in.temple.backend.dto.*;
import in.temple.backend.service.DonationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
