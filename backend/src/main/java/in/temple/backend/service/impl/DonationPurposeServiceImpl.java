package in.temple.backend.service.impl;

import in.temple.backend.model.*;
import in.temple.backend.repository.*;
import in.temple.backend.service.DonationPurposeService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DonationPurposeServiceImpl
        implements DonationPurposeService {

    private final DonationPurposeRepository purposeRepo;
    private final DonationPurposeAuditRepository auditRepo;

    @Override
    @Transactional(readOnly = true)
    public List<DonationPurpose> getActivePurposes() {
        return purposeRepo.findByActiveTrue();
    }

    @Override
    @Transactional
    public DonationPurpose create(
            String nameEn,
            String nameHi,
            String receiptPrefix,
    BigDecimal fixedAmount,
            String username) {

        enforceAdmin(username);

        DonationPurpose purpose = purposeRepo.save(
                DonationPurpose.builder()
                        .nameEn(nameEn)
                        .nameHi(nameHi)
                        .receiptPrefix(receiptPrefix)
                        .fixedAmount(fixedAmount)
                        .active(true)
                        .build()
        );

        auditRepo.save(buildAudit(
                purpose.getId(),
                "CREATE",
                username,
                "Created donation purpose"
        ));

        return purpose;
    }

    @Override
    @Transactional
    public DonationPurpose update(
            Long id,
            String nameEn,
            String nameHi,
            String receiptPrefix,
    BigDecimal fixedAmount,
            boolean active,
            String username) {

        enforceAdmin(username);

        DonationPurpose purpose = purposeRepo.findById(id)
                .orElseThrow(() ->
                        new IllegalStateException("Donation purpose not found"));

        purpose.setNameEn(nameEn);
        purpose.setNameHi(nameHi);
        purpose.setReceiptPrefix(receiptPrefix);
        purpose.setFixedAmount(fixedAmount);
        purpose.setActive(active);

        DonationPurpose updated = purposeRepo.save(purpose);

        auditRepo.save(buildAudit(
                id,
                "UPDATE",
                username,
                "Updated donation purpose"
        ));

        return updated;
    }

    /* ---------------- helpers ---------------- */

    private void enforceAdmin(String username) {
        // This assumes your JWT/interceptor already guarantees
        // username belongs to an admin user
        // If you have role lookup, plug it here
        if (username == null || username.isBlank()) {
            throw new SecurityException("Unauthorized");
        }
    }

    private DonationPurposeAudit buildAudit(
            Long purposeId,
            String action,
            String username,
            String summary) {

        return DonationPurposeAudit.builder()
                .donationPurposeId(purposeId)
                .action(action)
                .performedBy(username)
                .performedAt(LocalDateTime.now())
                .changeSummary(summary)
                .build();
    }
}
