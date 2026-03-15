package in.temple.backend.repository;

import in.temple.backend.model.DamagedInventory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DamagedInventoryRepository extends JpaRepository<DamagedInventory, Long> {
}
