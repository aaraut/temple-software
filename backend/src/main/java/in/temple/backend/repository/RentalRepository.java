package in.temple.backend.repository;

import in.temple.backend.model.Rental;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RentalRepository extends JpaRepository<Rental, Long> {
    Optional<Rental> findByReceiptNumber(String receiptNumber);
}
