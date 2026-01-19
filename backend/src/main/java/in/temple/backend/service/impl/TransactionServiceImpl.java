package in.temple.backend.service.impl;

import in.temple.backend.model.*;
import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.model.enums.OccurrenceType;
import in.temple.backend.repository.*;
import in.temple.backend.service.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionAbhishekDetailsRepository abhishekDetailsRepository;
    private final TransactionTimeDetailsRepository timeDetailsRepository;
    private final AbhishekRepository abhishekRepository;
    private final GotraRepository gotraRepository;

    private final ReceiptService receiptService;
    private final DurationService durationService;
    private final TransactionValidationService validationService;

    @Override
    @Transactional
    public Transaction saveTransaction(
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
            String gotraId,
            String username,
            boolean isAdmin
    ) {

        log.info("Starting transaction save for type={}", transactionType);

        // 1️⃣ VALIDATION
        validationService.validateTransaction(
                transactionType,
                fromDate,
                toDate,
                occurrenceType,
                fromTime,
                toTime,
                gotraId,
                isAdmin
        );

        // 2️⃣ RECEIPT (USERNAME REQUIRED)
        String receiptNumber =
                receiptService.consumeReceiptNumber(transactionType, username);

        // 3️⃣ TRANSACTION MASTER
        Transaction transaction = Transaction.builder()
                .receiptNumber(receiptNumber)
                .transactionType(transactionType)
                .languageCode(languageCode)
                .fullName(fullName)
                .mobileNumber(mobileNumber)
                .address(address)
                .paymentMode("CASH")
                .status("ACTIVE")
                .isDisabled(false)
                .build();

        transaction = transactionRepository.save(transaction);

        BigDecimal totalAmount = BigDecimal.ZERO;

        // 4️⃣ ABHISHEK DETAILS
        if (transactionType == TransactionType.ABHISHEK) {

            Abhishek abhishek = abhishekRepository.findById(abhishekId)
                    .orElseThrow(() ->
                            new IllegalArgumentException("Invalid Abhishek ID"));

            // Gotra ID IS STRING IN YOUR REPO
            Gotra gotra = gotraRepository.getReferenceById(gotraId);

            int duration = durationService.calculateDuration(
                    fromDate, toDate, occurrenceType);

            BigDecimal calculatedAmount =
                    abhishek.getAmount().multiply(BigDecimal.valueOf(duration));

            TransactionAbhishekDetails details =
                    TransactionAbhishekDetails.builder()
                            .transaction(transaction)
                            .abhishek(abhishek)
                            .gotra(gotra)
                            .fromDate(fromDate)
                            .toDate(toDate)
                            .occurrenceType(occurrenceType)
                            .duration(duration)
                            .amountPerUnit(abhishek.getAmount())
                            .calculatedAmount(calculatedAmount)
                            .build();

            abhishekDetailsRepository.save(details);
            totalAmount = calculatedAmount;
        }

        // 5️⃣ TIME DETAILS (OPTIONAL)
        if (fromTime != null && toTime != null) {
            TransactionTimeDetails timeDetails =
                    TransactionTimeDetails.builder()
                            .transaction(transaction)
                            .fromTime(fromTime)
                            .toTime(toTime)
                            .build();

            timeDetailsRepository.save(timeDetails);
        }

        // 6️⃣ TOTAL AMOUNT
        transaction.setTotalAmount(totalAmount);
        transaction = transactionRepository.save(transaction);

        log.info("Transaction completed receipt={} totalAmount={}",
                receiptNumber, totalAmount);

        return transaction;
    }
}
