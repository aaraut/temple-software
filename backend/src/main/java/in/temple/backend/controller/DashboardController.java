package in.temple.backend.controller;

import in.temple.backend.dto.DashboardSummaryResponse;
import in.temple.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary(
            @RequestParam String period,
            @RequestParam(required = false, defaultValue = "ALL") String selectedUser,
            @RequestParam String loggedInUser,
            @RequestParam String role,
            @RequestParam(required = false) String date  // optional: "yyyy-mm-dd"
    ) {
        LocalDate targetDate = (date != null && !date.isBlank())
                ? LocalDate.parse(date, DateTimeFormatter.ISO_LOCAL_DATE)
                : LocalDate.now();

        return dashboardService.getSummary(period, selectedUser, loggedInUser, role, targetDate);
    }
}
