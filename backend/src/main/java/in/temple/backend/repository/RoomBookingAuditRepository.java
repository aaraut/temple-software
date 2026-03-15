package in.temple.backend.repository;

import in.temple.backend.model.RoomBookingAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomBookingAuditRepository
        extends JpaRepository<RoomBookingAudit, Long> {
}
