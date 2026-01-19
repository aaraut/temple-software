package in.temple.backend.controller;

import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.service.ReceiptService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/receipt")
@RequiredArgsConstructor
@Slf4j
public class ReceiptController {

    private final ReceiptService receiptService;

    @GetMapping("/preview")
    public ResponseEntity<Map<TransactionType, String>> preview(
            @RequestHeader("X-USERNAME") String username) {

        return ResponseEntity.ok(
                receiptService.generateReceiptPreview(username)
        );
    }
}
