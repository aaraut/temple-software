package in.temple.backend.controller;

import in.temple.backend.model.DonationPurpose;
import in.temple.backend.service.DonationPurposeService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/donation-purpose")
@RequiredArgsConstructor
public class DonationPurposeController {

    private final DonationPurposeService service;

    // USER + ADMIN
    @GetMapping
    public ResponseEntity<List<DonationPurpose>> listActive() {
        return ResponseEntity.ok(service.getActivePurposes());
    }

    // ADMIN ONLY
    @PostMapping
    public ResponseEntity<DonationPurpose> create(
            @RequestParam String nameEn,
            @RequestParam String nameHi,
            @RequestParam String receiptPrefix,
            @RequestParam(required = false) BigDecimal fixedAmount,
            @RequestParam String username) {

        return ResponseEntity.ok(
                service.create(nameEn, nameHi,receiptPrefix, fixedAmount, username)
        );
    }

    // ADMIN ONLY
    @PutMapping("/{id}")
    public ResponseEntity<DonationPurpose> update(
            @PathVariable Long id,
            @RequestParam String nameEn,
            @RequestParam String nameHi,
            @RequestParam String receiptPrefix,
            @RequestParam(required = false) BigDecimal fixedAmount,
            @RequestParam boolean active,
            @RequestParam String username) {

        return ResponseEntity.ok(
                service.update(id, nameEn, nameHi, receiptPrefix, fixedAmount, active, username)
        );
    }
}
