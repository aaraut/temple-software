package in.temple.backend.service;

import in.temple.backend.model.DonationPurpose;

import java.math.BigDecimal;
import java.util.List;

public interface DonationPurposeService {

    List<DonationPurpose> getActivePurposes();

    DonationPurpose create(
            String nameEn,
            String nameHi,
            String receiptPrefix,
            BigDecimal fixedAmount,
            String username);

    DonationPurpose update(
            Long id,
            String nameEn,
            String nameHi,
            String receiptPrefix,
            BigDecimal fixedAmount,
            boolean active,
            String username);
}
