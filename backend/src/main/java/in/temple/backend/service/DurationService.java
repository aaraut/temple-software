package in.temple.backend.service;

import in.temple.backend.model.enums.OccurrenceType;

import java.time.LocalDate;

public interface DurationService {

    /**
     * Calculates duration for Abhishek based on date range
     * and occurrence type.
     *
     * @param fromDate start date (inclusive)
     * @param toDate end date (inclusive)
     * @param occurrenceType DAILY / WEEKLY
     * @return calculated duration (minimum 1)
     */
    int calculateDuration(
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType
    );
}
