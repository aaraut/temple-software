package in.temple.backend.repository;

import in.temple.backend.model.DonationPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonationPurposeRepository
        extends JpaRepository<DonationPurpose, Long> {

    List<DonationPurpose> findByActiveTrue();
}
