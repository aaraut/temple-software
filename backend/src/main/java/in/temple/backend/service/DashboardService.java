package in.temple.backend.service;

import in.temple.backend.dto.DashboardSummaryResponse;

public interface DashboardService {

    DashboardSummaryResponse getSummary(
            String period,
            String selectedUser,
            String loggedInUser,
            String role
    );
}