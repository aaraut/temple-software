package in.temple.backend.controller;

import in.temple.backend.model.ModuleAccessControl;
import in.temple.backend.model.ModuleAccessUpdateRequest;
import in.temple.backend.model.User;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.ModuleAccessService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/module-access")
@RequiredArgsConstructor
public class ModuleAccessController {

    private final AuthContextService authContextService;
    private final ModuleAccessService moduleAccessService;

    @GetMapping
    public List<ModuleAccessControl> listModules(HttpServletRequest request) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return moduleAccessService.listAll();
    }

    @PutMapping("/{id}")
    public ModuleAccessControl updateModule(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody ModuleAccessUpdateRequest body
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return moduleAccessService.updateToggles(id, body.isEnabledForAdmin(), body.isEnabledForUser());
    }
}
