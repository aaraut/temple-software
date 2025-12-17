package in.temple.backend.controller;

import in.temple.backend.model.*;
import in.temple.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ---------- LOGIN (NO JWT REQUIRED) ----------
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ---------- CHANGE PASSWORD (JWT REQUIRED) ----------
    @PostMapping("/change-password")
    public void changePassword(
            HttpServletRequest request,
            @RequestBody ChangePasswordRequest changePasswordRequest
    ) {
        User user = (User) request.getAttribute("loggedInUser");
        authService.changePassword(user.getUsername(), changePasswordRequest);
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

}
