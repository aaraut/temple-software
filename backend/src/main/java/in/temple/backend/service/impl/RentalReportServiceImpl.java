package in.temple.backend.service.impl;

import in.temple.backend.dto.*;
import in.temple.backend.repository.RentalReportRepository;
import in.temple.backend.service.RentalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalReportServiceImpl implements RentalReportService {

    private final RentalReportRepository repository;

    // ---------------- REPORT 1 ----------------

    @Override
    public Object getPendingRentals(
            String category,
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    ) {

        List<PendingRentalReportDto> result = new ArrayList<>();

        for (Object[] r : repository.fetchPendingRentalsRaw()) {

            PendingRentalReportDto dto = new PendingRentalReportDto();
            dto.setReceiptNumber((String) r[0]);
            dto.setCreatedAt(
                    ((java.sql.Timestamp) r[1]).toLocalDateTime()
            );
            dto.setCategory((String) r[2]);
            dto.setCustomerName((String) r[3]);
            dto.setMobile((String) r[4]);
            dto.setCreatedBy((String) r[5]);
            dto.setTotalIssuedQty(((Number) r[6]).intValue());
            dto.setTotalPendingQty(((Number) r[7]).intValue());
            dto.setDepositAmount((BigDecimal) r[8]);
            dto.setTotalFineAmount((BigDecimal) r[9]);
            dto.setStatus((String) r[10]);

            // filters
            if (category != null && !category.equals(dto.getCategory())) continue;
            if (createdBy != null && !createdBy.equals(dto.getCreatedBy())) continue;

            if (fromDate != null &&
                    dto.getCreatedAt().toLocalDate().isBefore(fromDate)) continue;

            if (toDate != null &&
                    dto.getCreatedAt().toLocalDate().isAfter(toDate)) continue;

            result.add(dto);
        }

        return result;
    }

    // ---------------- REPORT 4A ----------------

    @Override
    public Object getUserRentalSummary(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return buildSummary(createdBy, fromDate, toDate, false);
    }

    // ---------------- REPORT 4B ----------------

    @Override
    public Object getAdminRentalSummary(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        return buildSummary(createdBy, fromDate, toDate, true);
    }

    // ---------------- SHARED SUMMARY LOGIC ----------------

    private Object buildSummary(
            String createdByFilter,
            LocalDate fromDate,
            LocalDate toDate,
            boolean includeUserBreakdown
    ) {

        BigDecimal calculated = BigDecimal.ZERO;
        BigDecimal charged = BigDecimal.ZERO;
        BigDecimal fine = BigDecimal.ZERO;
        BigDecimal deposit = BigDecimal.ZERO;
        BigDecimal refunded = BigDecimal.ZERO;

        List<AdminRentalSummaryDto.UserBreakdown> users =
                new ArrayList<>();

        for (Object[] r : repository.fetchRentalSummaryRaw()) {

            String createdBy = (String) r[0];

            if (createdByFilter != null &&
                    !createdByFilter.equals(createdBy)) {
                continue;
            }

            BigDecimal calc = (BigDecimal) r[2];
            BigDecimal ch = (BigDecimal) r[3];
            BigDecimal f = (BigDecimal) r[4];
            BigDecimal dep = (BigDecimal) r[5];
            BigDecimal ref = (BigDecimal) r[6];

            calculated = calculated.add(calc);
            charged = charged.add(ch);
            fine = fine.add(f);
            deposit = deposit.add(dep);
            refunded = refunded.add(ref);

            if (includeUserBreakdown) {
                AdminRentalSummaryDto.UserBreakdown ub =
                        new AdminRentalSummaryDto.UserBreakdown();
                ub.setCreatedBy(createdBy);
                ub.setTotalRentals(((Number) r[1]).intValue());
                ub.setCalculatedAmount(calc);
                ub.setChargedAmount(ch);
                ub.setDiscountAmount(calc.subtract(ch));
                ub.setFineCollected(f);
                users.add(ub);
            }
        }

        AdminRentalSummaryDto dto = new AdminRentalSummaryDto();
        dto.setTotalCalculatedAmount(calculated);
        dto.setTotalChargedAmount(charged);
        dto.setTotalDiscountAmount(calculated.subtract(charged));
        dto.setTotalFineCollected(fine);
        dto.setDepositCollected(deposit);
        dto.setDepositRefunded(refunded);
        dto.setDepositPending(
                deposit.subtract(refunded).subtract(fine)
        );

        if (includeUserBreakdown) {
            dto.setUserBreakdown(users);
        }

        return dto;
    }

    @Override
    public Object getMyRentalEntries(
            String createdBy,
            LocalDate fromDate,
            LocalDate toDate,
            String category
    ) {
        List<MyRentalEntryReportDto> result = new ArrayList<>();

        for (Object[] r : repository.fetchMyRentalEntriesRaw(createdBy)) {

            LocalDateTime createdAt =
                    ((java.sql.Timestamp) r[1]).toLocalDateTime();

            if (fromDate != null &&
                    createdAt.toLocalDate().isBefore(fromDate)) continue;

            if (toDate != null &&
                    createdAt.toLocalDate().isAfter(toDate)) continue;

            if (category != null && !category.isEmpty() &&
                    !category.equals((String) r[2])) continue;

            MyRentalEntryReportDto dto = new MyRentalEntryReportDto();
            dto.setReceiptNumber((String) r[0]);
            dto.setCreatedAt(createdAt);
            dto.setCategory((String) r[2]);
            dto.setCustomerName((String) r[3]);
            dto.setMobile((String) r[4]);
            dto.setTotalIssuedQty(((Number) r[5]).intValue());
            dto.setTotalPendingQty(((Number) r[6]).intValue());

            BigDecimal calculated = (BigDecimal) r[7];
            BigDecimal charged = (BigDecimal) r[8];

            dto.setCalculatedAmount(calculated);
            dto.setChargedAmount(charged);
            dto.setDiscountAmount(calculated.subtract(charged));

            dto.setDepositAmount((BigDecimal) r[9]);
            dto.setTotalFineAmount((BigDecimal) r[10]);
            dto.setStatus((String) r[11]);

            result.add(dto);
        }

        return result;
    }

}
