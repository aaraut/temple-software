package in.temple.backend.service;

import in.temple.backend.model.ModuleAccessControl;
import in.temple.backend.model.User;
import in.temple.backend.repository.ModuleAccessControlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ModuleAccessService {

    private final ModuleAccessControlRepository repository;

    public List<ModuleAccessControl> listAll() {
        return repository.findAll();
    }

    public ModuleAccessControl updateToggles(Long id, boolean enabledForAdmin, boolean enabledForUser) {
        ModuleAccessControl module = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        module.setEnabledForAdmin(enabledForAdmin);
        module.setEnabledForUser(enabledForUser);

        return repository.save(module);
    }

    // Resolves each module to a single visible/not-visible boolean for the given role,
    // so the frontend only has to check one flag per module instead of the role rules.
    public Map<String, Boolean> resolveForRole(String role) {
        Map<String, Boolean> access = new LinkedHashMap<>();

        for (ModuleAccessControl module : repository.findAll()) {
            boolean visible;
            if ("SUPER_ADMIN".equals(role)) {
                visible = true;
            } else if ("ADMIN".equals(role)) {
                visible = module.isEnabledForAdmin();
            } else {
                visible = module.isEnabledForUser();
            }
            access.put(module.getModuleKey(), visible);
        }

        return access;
    }
}
