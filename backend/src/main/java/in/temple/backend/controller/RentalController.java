package in.temple.backend.controller;

import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;
import in.temple.backend.service.RentalService;
import lombok.RequiredArgsConstructor;
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

}
