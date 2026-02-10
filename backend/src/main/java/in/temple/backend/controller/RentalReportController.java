package in.temple.backend.controller;

import in.temple.backend.service.RentalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/rentals")
@RequiredArgsConstructor
public class RentalReportController {

    private final RentalReportService rentalReportService;

    /**
     * REPORT 1
     * Pending rentals
     * - User: frontend sends createdBy = logged-in user
     * - Admin: createdBy can be null or specific user
     */
    @GetMapping("/pending")
    public Object getPendingRentals(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return rentalReportService.getPendingRentals(
                category,
                createdBy,
                fromDate,
                toDate
        );
    }

    /**
     * REPORT 4A – User self summary
     * createdBy is mandatory (frontend passes auth.username)
     */
    @GetMapping("/summary/user")
    public Object getUserRentalSummary(
            @RequestParam String createdBy,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return rentalReportService.getUserRentalSummary(
                createdBy,
                fromDate,
                toDate
        );
    }

    /**
     * REPORT 4B – Admin summary (all users or filtered)
     */
    @GetMapping("/summary/admin")
    public Object getAdminRentalSummary(
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return rentalReportService.getAdminRentalSummary(
                createdBy,
                fromDate,
                toDate
        );
    }

    @GetMapping("/my-entries")
    public Object getMyRentalEntries(
            @RequestParam String createdBy,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String category
    ) {
        return rentalReportService.getMyRentalEntries(
                createdBy, fromDate, toDate, category
        );
    }

}
