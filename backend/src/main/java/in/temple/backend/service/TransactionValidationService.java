package in.temple.backend.service;

import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.model.enums.OccurrenceType;

import java.time.LocalDate;
import java.time.LocalTime;

public interface TransactionValidationService {

    /**
     * Validates business rules before saving a transaction.
     */
    void validateTransaction(
            TransactionType transactionType,
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType,
            LocalTime fromTime,
            LocalTime toTime,
            String gotraId,
            boolean isAdmin
    );
}
