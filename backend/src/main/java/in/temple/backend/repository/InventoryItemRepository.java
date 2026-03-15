package in.temple.backend.repository;


import in.temple.backend.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByCategoryAndIsActiveTrue(String category);
}