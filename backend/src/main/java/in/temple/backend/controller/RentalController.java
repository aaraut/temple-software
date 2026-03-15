package in.temple.backend.controller;

import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;
import in.temple.backend.service.RentalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalController {

    private final RentalService rentalService;

    /**
     * Issue a new rental (Rent out items)
     */
    @PostMapping("/issue")
    public ResponseEntity<?> issueRental(
            @RequestBody RentalIssueRequestDto request
    ) {
        String receiptNumber = rentalService.issueRental(request);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Rental issued successfully",
                        "receiptNumber", receiptNumber
                )
        );
    }

    /**
     * Return rental items (partial or full return)
     */
    @PostMapping("/return")
    public ResponseEntity<?> returnRental(
            @RequestBody RentalReturnRequestDto request
    ) {
        rentalService.returnRental(request);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Rental return processed successfully"
                )
        );
    }

    @GetMapping("/{receiptNumber}")
    public ResponseEntity<?> getRental(
            @PathVariable String receiptNumber
    ) {
        return ResponseEntity.ok(
                rentalService.getRentalByReceipt(receiptNumber)
        );
    }

    @PostMapping(
            value = "/create-and-print",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> createAndPrint(
            @RequestBody RentalIssueRequestDto request,
            @RequestParam String username
    ) {

        byte[] pdf =
                rentalService.createRentalAndReturnReceiptPdf(
                        request,
                        username
                );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=rental-receipt.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

}
