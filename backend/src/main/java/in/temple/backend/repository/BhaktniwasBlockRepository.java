package in.temple.backend.repository;

import in.temple.backend.model.BhaktniwasBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BhaktniwasBlockRepository extends JpaRepository<BhaktniwasBlock, Long> {

    List<BhaktniwasBlock> findByIsActiveTrueOrderBySortOrderAsc();

    Optional<BhaktniwasBlock> findByCode(String code);
}
