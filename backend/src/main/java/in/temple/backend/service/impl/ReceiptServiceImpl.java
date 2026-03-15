package in.temple.backend.service.impl;

import in.temple.backend.model.ReceiptSequence;
import in.temple.backend.model.enums.TransactionType;
import in.temple.backend.repository.ReceiptSequenceRepository;
import in.temple.backend.service.ReceiptService;
import in.temple.backend.service.UserContextService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptServiceImpl implements ReceiptService {

    private final ReceiptSequenceRepository receiptSequenceRepository;
    private final UserContextService userContextService;

    /**
     * PREVIEW ONLY
     * Does NOT lock or consume the sequence.
     * Preview number is NOT guaranteed to be final.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<TransactionType, String> generateReceiptPreview(String username) {

        ReceiptSequence sequence = receiptSequenceRepository.findById(1)
                .orElseThrow(() ->
                        new IllegalStateException("Receipt sequence not initialized"));

        long previewSequence = sequence.getLastSequence() + 1;

        char firstInitial = userContextService.getUserFirstInitial(username);
        char lastInitial  = userContextService.getUserLastInitial(username);

        Map<TransactionType, String> preview = new EnumMap<>(TransactionType.class);

        for (TransactionType type : TransactionType.values()) {
            preview.put(type, buildReceipt(type, firstInitial, lastInitial, previewSequence));
        }

        log.debug("Preview receipt number {} for user {}", previewSequence, username);
        return preview;
    }

    /**
     * CONSUMES the receipt number
     * This is the ONLY place where sequence is incremented.
     */
    @Override
    @Transactional
    public String consumeReceiptNumber(String prefix, String username) {

        if (prefix == null || prefix.isBlank()) {
            throw new IllegalStateException("Receipt prefix is required");
        }

        ReceiptSequence sequence =
                receiptSequenceRepository.findForUpdate(1)
                        .orElseThrow(() ->
                                new IllegalStateException("Receipt sequence not initialized"));

        long nextSequence = sequence.getLastSequence() + 1;
        sequence.setLastSequence(nextSequence);
        receiptSequenceRepository.save(sequence);

        char firstInitial = userContextService.getUserFirstInitial(username);
        char lastInitial  = userContextService.getUserLastInitial(username);

        return prefix + firstInitial + lastInitial + nextSequence;
    }


    private String buildReceipt(
            TransactionType type,
            char first,
            char last,
            long seq) {

        return getShortCode(type) + first + last + seq;
    }

    private String getShortCode(TransactionType type) {
        return switch (type) {
            case ABHISHEK -> "AB";
            case DAAN -> "DN";
            case ANNADAN -> "AN";
            case NIRMAN -> "NM";
            case PRASADAM -> "PR";
        };
    }
}
