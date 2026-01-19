package in.temple.backend.repository;

import in.temple.backend.model.ReceiptSequence;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface ReceiptSequenceRepository
        extends JpaRepository<ReceiptSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ReceiptSequence r WHERE r.id = :id")
    Optional<ReceiptSequence> findForUpdate(@Param("id") Integer id);
}
