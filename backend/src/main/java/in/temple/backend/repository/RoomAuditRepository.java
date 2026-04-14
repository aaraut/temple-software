package in.temple.backend.repository;

import in.temple.backend.model.RoomAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoomAuditRepository extends JpaRepository<RoomAudit, Long> {

    @Query(value = "SELECT * FROM room_audit WHERE room_id = :roomId AND action = 'BLOCKED' ORDER BY performed_at DESC LIMIT 1", nativeQuery = true)
    Optional<RoomAudit> findLatestBlockAudit(@Param("roomId") Long roomId);
}
