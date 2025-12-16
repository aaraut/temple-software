package in.temple.backend.controller;

import in.temple.backend.model.ChangePasswordRequest;
import in.temple.backend.model.LoginRequest;
import in.temple.backend.model.LoginResponse;
import in.temple.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/change-password")
    public void changePassword(
            @RequestHeader("X-USERNAME") String username,
            @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(username, request);
    }

}
