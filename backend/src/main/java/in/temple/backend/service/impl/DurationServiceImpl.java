package in.temple.backend.service.impl;

import in.temple.backend.model.enums.OccurrenceType;
import in.temple.backend.service.DurationService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@Slf4j
public class DurationServiceImpl implements DurationService {

    @Override
    public int calculateDuration(
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType) {

        if (fromDate == null || toDate == null) {
            throw new IllegalArgumentException("From date and To date must not be null");
        }

        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("To date cannot be before From date");
        }

        long totalDaysInclusive =
                ChronoUnit.DAYS.between(fromDate, toDate) + 1;

        int duration;

        switch (occurrenceType) {
            case DAILY -> duration = (int) totalDaysInclusive;
            case WEEKLY -> duration = (int) Math.ceil(totalDaysInclusive / 7.0);
            default -> throw new IllegalArgumentException(
                    "Unsupported occurrence type: " + occurrenceType
            );
        }

        // Safety guard (your rule: minimum should always be 1)
        duration = Math.max(duration, 1);

        log.debug(
                "Calculated duration={} for occurrenceType={} fromDate={} toDate={}",
                duration, occurrenceType, fromDate, toDate
        );

        return duration;
    }
}
