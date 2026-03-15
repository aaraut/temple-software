package in.temple.backend.repository;

import in.temple.backend.model.InventoryItemAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemAuditRepository
        extends JpaRepository<InventoryItemAudit, Long> {
}