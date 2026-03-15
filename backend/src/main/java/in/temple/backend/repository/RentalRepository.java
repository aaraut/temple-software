package in.temple.backend.repository;

import in.temple.backend.model.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RentalRepository extends JpaRepository<Rental, Long> {
    Optional<Rental> findByReceiptNumber(String receiptNumber);

    List<Rental> findByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Rental> findByCreatedAtBetweenAndCreatedBy(
            LocalDateTime start,
            LocalDateTime end,
            String createdBy
    );
}
