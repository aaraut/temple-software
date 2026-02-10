package in.temple.backend.service;

import java.time.LocalDate;

public interface RentalReportService {

    Object getPendingRentals(
            String category,
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    );

    Object getUserRentalSummary(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    );

    Object getAdminRentalSummary(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    );

    Object getMyRentalEntries(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate,
            String category
    );

}
