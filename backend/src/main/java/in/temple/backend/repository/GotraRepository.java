package in.temple.backend.repository;

import in.temple.backend.model.Gotra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GotraRepository extends JpaRepository<Gotra, String> {
    boolean existsByEnglishName(String englishName);
}