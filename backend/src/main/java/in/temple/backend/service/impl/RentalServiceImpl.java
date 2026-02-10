package in.temple.backend.service.impl;

import in.temple.backend.dto.RentalDetailsResponseDto;
import in.temple.backend.dto.RentalIssueRequestDto;
import in.temple.backend.dto.RentalReturnRequestDto;
import in.temple.backend.model.*;
import in.temple.backend.model.enums.RentalStatus;
import in.temple.backend.repository.*;
import in.temple.backend.service.RentalService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalServiceImpl implements RentalService {

    private final RentalRepository rentalRepository;
    private final RentalItemRepository rentalItemRepository;
    private final RentalReturnRepository rentalReturnRepository;
    private final DamagedInventoryRepository damagedInventoryRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public String issueRental(RentalIssueRequestDto request) {

        Long seq = ((Number) entityManager
                .createNativeQuery("SELECT nextval('rental_receipt_seq')")
                .getSingleResult()).longValue();

        String receipt = "RENT-" + Year.now().getValue() + "-" + String.format("%07d", seq);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (RentalIssueRequestDto.Item item : request.getItems()) {
            InventoryItem inv = entityManager.find(
                    InventoryItem.class,
                    item.getInventoryItemId(),
                    LockModeType.PESSIMISTIC_WRITE
            );

            // ✅ CATEGORY SAFETY CHECK (ADD THIS)
            if (!request.getCategory().name().equalsIgnoreCase(inv.getCategory())) {
                throw new RuntimeException(
                        "Inventory item category mismatch for item: " + inv.getMaterialNameHi()
                );
            }

            if (inv.getTotalStock() < item.getQuantity()) {
                throw new RuntimeException("Out of stock: " + inv.getMaterialNameHi());
            }

            inv.setTotalStock(inv.getTotalStock() - item.getQuantity());
            BigDecimal lineTotal =
                    inv.getRate().multiply(BigDecimal.valueOf(item.getQuantity()));

            calculatedTotal = calculatedTotal.add(lineTotal);
        }

        Rental rental = rentalRepository.save(
                Rental.builder()
                        .receiptNumber(receipt)
                        .category(request.getCategory())
                        .customerName(request.getCustomerName())
                        .mobile(request.getMobile())
                        .address(request.getAddress())
                        .aadhaar(request.getAadhaar())
                        .calculatedTotalAmount(calculatedTotal)
                        .chargedAmount(BigDecimal.valueOf(request.getChargedAmount()))
                        .depositAmount(BigDecimal.valueOf(request.getDepositAmount()))
                        .status(RentalStatus.ISSUED)
                        .createdBy(request.getCreatedBy())
                        .build()
        );

        for (RentalIssueRequestDto.Item item : request.getItems()) {
            InventoryItem inv = entityManager.find(InventoryItem.class, item.getInventoryItemId());

            rentalItemRepository.save(
                    RentalItem.builder()
                            .rentalId(rental.getId())
                            .inventoryItemId(inv.getId())
                            .itemNameSnapshot(inv.getMaterialNameHi())
                            .rateAtIssue(inv.getRate())
                            .issuedQty(item.getQuantity())
                            .returnedQty(0)
                            .damagedQty(0)
                            .missingQty(0)
                            .build()
            );
        }

        return receipt;
    }

    @Override
    @Transactional
    public void returnRental(RentalReturnRequestDto request) {

        Rental rental = rentalRepository.findByReceiptNumber(request.getReceiptNumber())
                .orElseThrow(() -> new RuntimeException("Invalid receipt"));

        if (rental.getStatus() == RentalStatus.CLOSED) {
            throw new RuntimeException("Rental already closed");
        }

        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());

        for (RentalReturnRequestDto.Item r : request.getItems()) {

            RentalItem ri = items.stream()
                    .filter(i -> i.getId().equals(r.getRentalItemId()))
                    .findFirst()
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Invalid rentalItemId " + r.getRentalItemId() +
                                            " for receipt " + request.getReceiptNumber()
                            )
                    );


            int remaining = ri.getIssuedQty()
                    - ri.getReturnedQty()
                    - ri.getDamagedQty()
                    - ri.getMissingQty();

            int delta = r.getReturnedQty() + r.getDamagedQty() + r.getMissingQty();

            if (delta > remaining) {
                throw new RuntimeException("Invalid return quantity");
            }

            if (r.getReturnedQty() > 0) {
                InventoryItem inv = entityManager.find(
                        InventoryItem.class,
                        ri.getInventoryItemId(),
                        LockModeType.PESSIMISTIC_WRITE
                );
                inv.setTotalStock(inv.getTotalStock() + r.getReturnedQty());
            }

            ri.setReturnedQty(ri.getReturnedQty() + r.getReturnedQty());
            ri.setDamagedQty(ri.getDamagedQty() + r.getDamagedQty());
            ri.setMissingQty(ri.getMissingQty() + r.getMissingQty());
        }

        if (request.getFineAmount() != null) {
            rental.setTotalFineAmount(
                    rental.getTotalFineAmount()
                            .add(BigDecimal.valueOf(request.getFineAmount()))
            );
        }

        rentalReturnRepository.save(
                RentalReturn.builder()
                        .rentalId(rental.getId())
                        .fineAmount(request.getFineAmount())
                        .remarks(request.getRemarks())
                        .createdBy(request.getHandledBy())
                        .build()
        );

        boolean completed = items.stream().allMatch(i ->
                i.getIssuedQty().equals(
                        i.getReturnedQty() + i.getDamagedQty() + i.getMissingQty()
                )
        );

        rental.setStatus(completed ? RentalStatus.CLOSED : RentalStatus.PARTIALLY_RETURNED);
    }

    @Override
    @Transactional(readOnly = true)
    public RentalDetailsResponseDto getRentalByReceipt(String receiptNumber) {

        Rental rental = rentalRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new RuntimeException("Invalid receipt number"));

        List<RentalItem> items = rentalItemRepository.findByRentalId(rental.getId());

        RentalDetailsResponseDto dto = new RentalDetailsResponseDto();
        dto.setReceiptNumber(rental.getReceiptNumber());
        dto.setCustomerName(rental.getCustomerName());
        dto.setMobile(rental.getMobile());
        dto.setAddress(rental.getAddress());
        dto.setDepositAmount(rental.getDepositAmount());
        dto.setTotalFineAmount(rental.getTotalFineAmount());
        dto.setStatus(rental.getStatus().name());

        dto.setItems(
                items.stream().map(i -> {
                    RentalDetailsResponseDto.Item it = new RentalDetailsResponseDto.Item();
                    it.setRentalItemId(i.getId());
                    it.setItemName(i.getItemNameSnapshot());
                    it.setRate(i.getRateAtIssue());
                    it.setIssuedQty(i.getIssuedQty());
                    it.setReturnedQty(i.getReturnedQty());
                    it.setDamagedQty(i.getDamagedQty());
                    it.setMissingQty(i.getMissingQty());

                    int remaining =
                            i.getIssuedQty()
                                    - i.getReturnedQty()
                                    - i.getDamagedQty()
                                    - i.getMissingQty();

                    it.setRemainingQty(remaining);
                    return it;
                }).toList()
        );

        return dto;
    }

}
