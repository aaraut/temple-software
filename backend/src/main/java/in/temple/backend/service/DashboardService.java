package in.temple.backend.service;

import in.temple.backend.dto.DashboardSummaryResponse;

import java.time.LocalDate;

public interface DashboardService {

    DashboardSummaryResponse getSummary(
            String period,
            String selectedUser,
            String loggedInUser,
            String role,
            LocalDate targetDate
    );
}
