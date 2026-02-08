package in.temple.backend.repository;

import in.temple.backend.model.DonationPurposeAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationPurposeAuditRepository
        extends JpaRepository<DonationPurposeAudit, Long> {
}
