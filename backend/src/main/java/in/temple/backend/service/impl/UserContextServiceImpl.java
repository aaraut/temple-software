package in.temple.backend.service.impl;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import in.temple.backend.service.UserContextService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserContextServiceImpl implements UserContextService {

    private final UserRepository userRepository;

    @Override
    public char getUserFirstInitial(String username) {
        User user = getUser(username);
        return extractFirstInitial(user.getName());
    }

    @Override
    public char getUserLastInitial(String username) {
        User user = getUser(username);
        return extractLastInitial(user.getName());
    }

    @Override
    public boolean isAdmin(String username) {
        User user = getUser(username);
        return "ADMIN".equalsIgnoreCase(user.getRole())
                || "SUPER_ADMIN".equalsIgnoreCase(user.getRole());
    }

    // ---------- helpers ----------

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalStateException("User not found: " + username));
    }

    private char extractFirstInitial(String name) {
        if (name == null || name.isBlank()) {
            return 'X';
        }
        return Character.toUpperCase(name.trim().charAt(0));
    }

    private char extractLastInitial(String name) {
        if (name == null || name.isBlank()) {
            return 'X';
        }
        String[] parts = name.trim().split("\\s+");
        return Character.toUpperCase(
                parts[parts.length - 1].charAt(0)
        );
    }
}
