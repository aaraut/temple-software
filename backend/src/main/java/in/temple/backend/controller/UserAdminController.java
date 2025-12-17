package in.temple.backend.controller;

import in.temple.backend.model.User;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.UserAdminService;
import jakarta.servlet.http.HttpServletRequest;
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
            HttpServletRequest request,
            @PathVariable Long userId,
            @RequestParam String tempPassword
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        userAdminService.resetUserPassword(admin, userId, tempPassword);
    }

    @GetMapping
    public List<User> listUsers(HttpServletRequest request) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.getAllUsersForAdmin(admin);
    }

    @PostMapping
    public User createUser(
            HttpServletRequest request,
            @RequestBody User user
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.createUser(admin, user);
    }

    @PutMapping("/{userId}")
    public User updateUser(
            HttpServletRequest request,
            @PathVariable Long userId,
            @RequestBody User updatedUser
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        return userAdminService.updateUser(admin, userId, updatedUser);
    }

    @PatchMapping("/{userId}/status")
    public void updateUserStatus(
            HttpServletRequest request,
            @PathVariable Long userId,
            @RequestParam boolean active
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "ADMIN", "SUPER_ADMIN");

        userAdminService.updateUserStatus(admin, userId, active);
    }

    @PatchMapping("/{userId}/unlock")
    public void unlockUser(
            HttpServletRequest request,
            @PathVariable Long userId
    ) {
        User admin = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(admin, "SUPER_ADMIN");

        userAdminService.unlockUser(userId, admin.getUsername());
    }
}
