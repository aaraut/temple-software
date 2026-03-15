package in.temple.backend.repository;

import in.temple.backend.model.RentalReturn;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalReturnRepository extends JpaRepository<RentalReturn, Long> {
}
