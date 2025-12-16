package in.temple.backend.controller;

import in.temple.backend.model.User;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.UserAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public List<User> listUsers(
            @RequestHeader("X-USERNAME") String adminUsername
    ) {
        User admin = authContextService.getLoggedInUser(adminUsername);
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.getAllUsersForAdmin(admin);
    }

    @PostMapping
    public User createUser(
            @RequestHeader("X-USERNAME") String adminUsername,
            @RequestBody User user
    ) {
        User admin = authContextService.getLoggedInUser(adminUsername);
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.createUser(admin, user);
    }

    @PutMapping("/{userId}")
    public User updateUser(
            @RequestHeader("X-USERNAME") String adminUsername,
            @PathVariable Long userId,
            @RequestBody User updatedUser
    ) {
        User admin = authContextService.getLoggedInUser(adminUsername);
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.updateUser(admin, userId, updatedUser);
    }

    @PatchMapping("/{userId}/status")
    public void updateUserStatus(
            @RequestHeader("X-USERNAME") String adminUsername,
            @PathVariable Long userId,
            @RequestParam boolean active
    ) {
        User admin = authContextService.getLoggedInUser(adminUsername);
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        userAdminService.updateUserStatus(admin, userId, active);
    }




}
