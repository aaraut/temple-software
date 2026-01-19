package in.temple.backend.service.impl;

import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.model.enums.OccurrenceType;
import in.temple.backend.service.TransactionValidationService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
@Slf4j
public class TransactionValidationServiceImpl
        implements TransactionValidationService {

    @Override
    public void validateTransaction(
            TransactionType transactionType,
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType,
            LocalTime fromTime,
            LocalTime toTime,
            String gotraId,
            boolean isAdmin) {

        if (transactionType == null) {
            throw new IllegalArgumentException("Transaction type is mandatory");
        }

        validateDateRules(transactionType, fromDate, toDate, occurrenceType);
        validateTimeRules(transactionType, fromTime, toTime);
        validateGotraRules(transactionType, gotraId);

        // Role-based rule (future-proofing)
        if (!isAdmin) {
            log.debug("Validation executed under USER context");
        } else {
            log.debug("Validation executed under ADMIN context");
        }
    }

    // ---------------- DATE RULES ----------------

    private void validateDateRules(
            TransactionType transactionType,
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType) {

        if (transactionType == TransactionType.ABHISHEK) {

            if (fromDate == null || toDate == null) {
                throw new IllegalArgumentException(
                        "From Date and To Date are mandatory for Abhishek");
            }

            if (toDate.isBefore(fromDate)) {
                throw new IllegalArgumentException(
                        "To Date cannot be before From Date");
            }

            if (occurrenceType == null) {
                throw new IllegalArgumentException(
                        "Occurrence type is mandatory for Abhishek");
            }
        } else {
            // Non-Abhishek types must NOT carry date range
            if (fromDate != null || toDate != null) {
                throw new IllegalArgumentException(
                        "Date range is not applicable for " + transactionType);
            }
        }
    }

    // ---------------- TIME RULES ----------------

    private void validateTimeRules(
            TransactionType transactionType,
            LocalTime fromTime,
            LocalTime toTime) {

        boolean timeRequired =
                transactionType == TransactionType.ABHISHEK
                        || transactionType == TransactionType.ANNADAN
                        || transactionType == TransactionType.PRASADAM;

        if (timeRequired) {

            if (fromTime == null || toTime == null) {
                throw new IllegalArgumentException(
                        "Time range is mandatory for " + transactionType);
            }

            if (!fromTime.isBefore(toTime)) {
                throw new IllegalArgumentException(
                        "From Time must be before To Time");
            }

        } else {
            // Time must NOT be sent for these types
            if (fromTime != null || toTime != null) {
                throw new IllegalArgumentException(
                        "Time range is not applicable for " + transactionType);
            }
        }
    }

    // ---------------- GOTRA RULES ----------------

    private void validateGotraRules(
            TransactionType transactionType,
            String gotraId) {

        if (transactionType == TransactionType.ABHISHEK) {
            if (gotraId == null) {
                throw new IllegalArgumentException(
                        "Gotra is mandatory for Abhishek");
            }
        } else {
            if (gotraId != null) {
                throw new IllegalArgumentException(
                        "Gotra is applicable only for Abhishek");
            }
        }
    }
}
