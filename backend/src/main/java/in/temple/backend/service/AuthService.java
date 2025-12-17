package in.temple.backend.service;

import in.temple.backend.model.*;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (user.isAccountLocked()) {
            throw new RuntimeException("Account is locked. Contact Super Admin.");
        }

        if (!user.isActive()) {
            throw new RuntimeException("User is inactive");
        }

        boolean passwordMatches;

        // ✅ BCrypt password (new users)
        if (user.getPassword() != null && user.getPassword().startsWith("$2")) {
            passwordMatches = passwordEncoder.matches(
                    request.getPassword(),
                    user.getPassword()
            );
        }
        // ✅ Plain text password (legacy users)
        else {
            passwordMatches = user.getPassword().equals(request.getPassword());

            // 🔁 Auto-upgrade to BCrypt after successful login
            if (passwordMatches) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        }

        if (!passwordMatches) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);

            if (user.getFailedLoginAttempts() >= 5) {
                user.setAccountLocked(true);
            }

            userRepository.save(user);

            throw new RuntimeException("Invalid username or password");
        }

        LoginResponse response = new LoginResponse();
        response.setUsername(user.getUsername());
        response.setRole(user.getRole());
        response.setForcePasswordChange(user.isForcePasswordChange());
        response.setToken(
                jwtService.generateToken(user.getUsername(), user.getRole())
        );
        return response;
    }

    public void changePassword(String username, ChangePasswordRequest request) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("User is inactive");
        }

        if (user.isAccountLocked()) {
            throw new RuntimeException("Account is locked");
        }

        boolean matches;

        if (user.getPassword().startsWith("$2a$")) {
            matches = passwordEncoder.matches(
                    request.getOldPassword(),
                    user.getPassword()
            );
        } else {
            matches = user.getPassword().equals(request.getOldPassword());
        }

        if (!matches) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setForcePasswordChange(false);
        user.setFailedLoginAttempts(0);

        userRepository.save(user);
    }

    public void forgotPassword(ForgotPasswordRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("User is inactive");
        }

        if (user.isAccountLocked()) {
            throw new RuntimeException("Account is locked. Contact Super Admin.");
        }

        // Identity verification
        if (!user.getDob().equals(request.getDob()) ||
                !user.getAadhaarLast4().equals(request.getAadhaarLast4())) {
            throw new RuntimeException("Identity verification failed");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setForcePasswordChange(false);
        user.setFailedLoginAttempts(0);

        userRepository.save(user);

        auditService.log(
                "FORGOT_PASSWORD",
                user.getUsername(),
                user.getUsername(),
                "Password reset via identity verification"
        );
    }


}
