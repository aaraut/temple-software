package in.temple.backend.controller;

import in.temple.backend.model.User;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final AuthContextService authContextService;
    private final UserAdminService userAdminService;

    @PostMapping("/{userId}/reset-password")
    public void resetUserPassword(
            @RequestHeader("X-USERNAME") String adminUsername,
            @PathVariable Long userId,
            @RequestParam String tempPassword
    ) {
        User admin = authContextService.getLoggedInUser(adminUsername);
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        userAdminService.resetUserPassword(admin, userId, tempPassword);
    }
}
