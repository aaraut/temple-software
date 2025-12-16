package in.temple.backend.service;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public void resetUserPassword(User admin, Long userId, String tempPassword) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ADMIN cannot reset ADMIN / SUPER_ADMIN
        if (admin.getRole().equals("ADMIN") &&
                !user.getRole().equals("USER")) {
            throw new RuntimeException("Admin cannot reset admin passwords");
        }

        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setForcePasswordChange(true);

        userRepository.save(user);
    }
}
