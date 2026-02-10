package in.temple.backend.repository;

import in.temple.backend.model.RentalItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalItemRepository extends JpaRepository<RentalItem, Long> {
    List<RentalItem> findByRentalId(Long rentalId);
}
