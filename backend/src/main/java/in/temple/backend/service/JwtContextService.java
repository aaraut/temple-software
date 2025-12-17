package in.temple.backend.service;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtContextService {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public User getUserFromAuthHeader(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        String username = jwtService.extractUsername(token);

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
