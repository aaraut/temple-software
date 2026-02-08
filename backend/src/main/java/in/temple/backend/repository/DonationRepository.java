package in.temple.backend.repository;

import in.temple.backend.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationRepository
        extends JpaRepository<Donation, Long> {
}
