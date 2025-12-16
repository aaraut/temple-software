package in.temple.backend.service;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthContextService {

    private final UserRepository userRepository;

    public User getLoggedInUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid user context"));
    }

    public void requireRole(User user, String... allowedRoles) {
        for (String role : allowedRoles) {
            if (user.getRole().equals(role)) {
                return;
            }
        }
        throw new RuntimeException("Access denied");
    }
}
