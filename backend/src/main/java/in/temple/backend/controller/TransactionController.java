package in.temple.backend.controller;

import in.temple.backend.model.Transaction;
import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.model.enums.OccurrenceType;
import in.temple.backend.service.TransactionService;
import in.temple.backend.service.UserContextService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/transaction")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;
    private final UserContextService userContextService;

    @PostMapping("/save")
    public ResponseEntity<Transaction> saveTransaction(

            @RequestHeader("X-USERNAME") String username,

            @RequestParam TransactionType transactionType,
            @RequestParam String fullName,
            @RequestParam(required = false) String mobileNumber,
            @RequestParam(required = false) String address,
            @RequestParam(defaultValue = "HI") String languageCode,

            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) OccurrenceType occurrenceType,

            @RequestParam(required = false) LocalTime fromTime,
            @RequestParam(required = false) LocalTime toTime,

            @RequestParam(required = false) Long abhishekId,
            @RequestParam(required = false) String gotraId
    ) {

        boolean isAdmin = userContextService.isAdmin(username);

        Transaction tx = transactionService.saveTransaction(
                transactionType,
                fullName,
                mobileNumber,
                address,
                languageCode,
                fromDate,
                toDate,
                occurrenceType,
                fromTime,
                toTime,
                abhishekId,
                gotraId,     // NO String.valueOf
                username,    // REQUIRED
                isAdmin
        );

        return ResponseEntity.ok(tx);
    }
}
