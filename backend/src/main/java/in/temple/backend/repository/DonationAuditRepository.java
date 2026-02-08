package in.temple.backend.repository;

import in.temple.backend.model.DonationAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationAuditRepository
        extends JpaRepository<DonationAudit, Long> {
}
