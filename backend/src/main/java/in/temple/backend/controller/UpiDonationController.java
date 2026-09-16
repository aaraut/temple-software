package in.temple.backend.controller;

import in.temple.backend.dto.UpiDonationListItemDto;
import in.temple.backend.dto.UpiDonationRequestDto;
import in.temple.backend.dto.UpiDonationSearchRequestDto;
import in.temple.backend.service.UpiDonationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/upi-donation")
@RequiredArgsConstructor
public class UpiDonationController {

    private final UpiDonationService upiDonationService;

    @PostMapping(value = "/create-and-print", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> createAndPrint(
            @RequestBody UpiDonationRequestDto request,
            @RequestParam String username,
            @RequestParam(defaultValue = "hi") String language) {

        byte[] pdf = upiDonationService.createAndReturnReceiptPdf(request, username, language);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=upi-receipt.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping(value = "/{id}/print", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> reprint(
            @PathVariable Long id,
            @RequestParam(defaultValue = "hi") String language) {

        byte[] pdf = upiDonationService.generateReceiptPdfById(id, language);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=upi-receipt-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/search")
    public List<UpiDonationListItemDto> search(@RequestBody UpiDonationSearchRequestDto req) {
        return upiDonationService.search(req);
    }
}
