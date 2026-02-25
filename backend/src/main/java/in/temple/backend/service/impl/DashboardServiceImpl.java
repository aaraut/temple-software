package in.temple.backend.service.impl;

import in.temple.backend.dto.DashboardSummaryResponse;
import in.temple.backend.dto.DonationSummaryDTO;
import in.temple.backend.dto.RentalSummaryDTO;
import in.temple.backend.dto.SummaryItem;
import in.temple.backend.model.Donation;
import in.temple.backend.model.DonationPurpose;
import in.temple.backend.model.Rental;
import in.temple.backend.model.enums.InventoryCategory;
import in.temple.backend.repository.DonationPurposeRepository;
import in.temple.backend.repository.DonationRepository;
import in.temple.backend.repository.RentalRepository;
import in.temple.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DonationRepository donationRepository;
    private final RentalRepository rentalRepository;
    private final DonationPurposeRepository donationPurposeRepository;

    @Override
    public DashboardSummaryResponse getSummary(
            String period,
            String selectedUser,
            String loggedInUser,
            String role
    ) {

        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);

        String filterUser = isAdmin
                ? ("ALL".equalsIgnoreCase(selectedUser) ? null : selectedUser)
                : loggedInUser;

        LocalDateTime start;
        LocalDateTime end = LocalDateTime.now();

        switch (period.toUpperCase()) {
            case "DAILY" ->
                    start = LocalDate.now().atStartOfDay();
            case "WEEKLY" ->
                    start = LocalDate.now().minusDays(6).atStartOfDay();
            case "MONTHLY" ->
                    start = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            default ->
                    throw new IllegalArgumentException("Invalid period");
        }

        // ================= DONATIONS =================

        List<DonationPurpose> allPurposes =
                donationPurposeRepository.findAll()
                        .stream()
                        .filter(DonationPurpose::isActive)
                        .toList();

        List<Donation> donations = (filterUser == null)
                ? donationRepository.findByCreatedAtBetweenAndActiveTrue(start, end)
                : donationRepository.findByCreatedAtBetweenAndCreatedByAndActiveTrue(start, end, filterUser);

        Map<String, DonationSummaryDTO> donationMap = new LinkedHashMap<>();

        // Initialize all purposes except Goshala
        for (DonationPurpose purpose : allPurposes) {

            if ("Goshala Daan".equalsIgnoreCase(purpose.getNameEn())) {
                continue;
            }

            donationMap.put(
                    purpose.getNameEn(),
                    DonationSummaryDTO.builder()
                            .purpose(purpose.getNameEn())
                            .receiptCount(0L)
                            .amount(BigDecimal.ZERO)
                            .build()
            );
        }

        BigDecimal donationTotal = BigDecimal.ZERO;

        // ✅ GOSHALA CALCULATION VARIABLES
        Long goshalaCount = 0L;
        BigDecimal goshalaAmount = BigDecimal.ZERO;

        for (Donation d : donations) {

            String purposeName = d.getPurposeNameEn();

            // ✅ HANDLE GOSHALA SEPARATELY
            if ("Goshala Daan".equalsIgnoreCase(purposeName)) {
                goshalaCount++;
                goshalaAmount = goshalaAmount.add(d.getAmount());
                continue;
            }

            DonationSummaryDTO dto = donationMap.get(purposeName);

            if (dto != null) {
                dto.setReceiptCount(dto.getReceiptCount() + 1);
                dto.setAmount(dto.getAmount().add(d.getAmount()));
                donationTotal = donationTotal.add(d.getAmount());
            }
        }

        // ================= RENTALS =================

        List<Rental> rentals = (filterUser == null)
                ? rentalRepository.findByCreatedAtBetween(start, end)
                : rentalRepository.findByCreatedAtBetweenAndCreatedBy(start, end, filterUser);

        RentalSummaryDTO bartan =
                new RentalSummaryDTO(0L, BigDecimal.ZERO, BigDecimal.ZERO);

        RentalSummaryDTO bichayat =
                new RentalSummaryDTO(0L, BigDecimal.ZERO, BigDecimal.ZERO);

        BigDecimal rentTotal = BigDecimal.ZERO;
        BigDecimal depositTotal = BigDecimal.ZERO;

        for (Rental r : rentals) {

            if (r.getStatus() == null) continue;

            InventoryCategory category = r.getCategory();

            BigDecimal charged =
                    r.getChargedAmount() != null
                            ? r.getChargedAmount()
                            : BigDecimal.ZERO;

            BigDecimal deposit =
                    r.getDepositAmount() != null
                            ? r.getDepositAmount()
                            : BigDecimal.ZERO;

            if (InventoryCategory.BARTAN.equals(category)) {

                bartan.setTransactions(bartan.getTransactions() + 1);
                bartan.setRentTotal(bartan.getRentTotal().add(charged));
                bartan.setDepositTotal(bartan.getDepositTotal().add(deposit));

            } else if (InventoryCategory.BICHAYAT.equals(category)) {

                bichayat.setTransactions(bichayat.getTransactions() + 1);
                bichayat.setRentTotal(bichayat.getRentTotal().add(charged));
                bichayat.setDepositTotal(bichayat.getDepositTotal().add(deposit));
            }

            rentTotal = rentTotal.add(charged);
            depositTotal = depositTotal.add(deposit);
        }

        BigDecimal collectionTotal = donationTotal.add(rentTotal);

        return DashboardSummaryResponse.builder()
                .donations(new ArrayList<>(donationMap.values()))
                .rentalBartan(bartan)
                .rentalBichayat(bichayat)
                .collectionTotal(collectionTotal)
                .depositTotal(depositTotal)
                .goshalaDaan(
                        SummaryItem.builder()
                                .purpose("Goshala Daan")
                                .receiptCount(goshalaCount)
                                .amount(goshalaAmount)
                                .build()
                )
                .build();
    }
}