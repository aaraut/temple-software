package in.temple.backend.repository;

import in.temple.backend.model.ModuleAccessControl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleAccessControlRepository extends JpaRepository<ModuleAccessControl, Long> {
    Optional<ModuleAccessControl> findByModuleKey(String moduleKey);
}
