package in.temple.backend.service;

import in.temple.backend.model.enums.TransactionType;

import java.util.Map;

public interface ReceiptService {

    Map<TransactionType, String> generateReceiptPreview(String username);

    String consumeReceiptNumber(TransactionType transactionType, String username);
}
