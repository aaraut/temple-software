package in.temple.backend.service;

import in.temple.backend.model.Transaction;
import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.model.enums.OccurrenceType;

import java.time.LocalDate;
import java.time.LocalTime;

public interface TransactionService {

    Transaction saveTransaction(
            TransactionType transactionType,
            String fullName,
            String mobileNumber,
            String address,
            String languageCode,
            LocalDate fromDate,
            LocalDate toDate,
            OccurrenceType occurrenceType,
            LocalTime fromTime,
            LocalTime toTime,
            Long abhishekId,
            String gotraId,      // STRING (as per repository)
            String username,     // REQUIRED for receipt
            boolean isAdmin
    );
}
