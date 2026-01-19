package in.temple.backend.repository;

import in.temple.backend.model.Abhishek;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AbhishekRepository extends JpaRepository<Abhishek, Long> {

    Optional<Abhishek> findByNameAndIsDisabledFalse(String name);

    boolean existsByNameAndIsDisabledFalse(String name);
}
