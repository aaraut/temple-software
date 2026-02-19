package in.temple.backend.repository;

import in.temple.backend.model.RoomAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomAuditRepository extends JpaRepository<RoomAudit, Long> {
}
