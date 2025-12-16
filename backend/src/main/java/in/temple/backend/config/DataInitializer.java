package in.temple.backend.config;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    private final BCryptPasswordEncoder passwordEncoder;


    @Bean
    CommandLineRunner initUsers(UserRepository userRepository) {
        return args -> {

            if (userRepository.count() > 0) {
                return; // prevent duplicate insert
            }

            // Super Admin
            userRepository.save(createUser(
                    "superadmin", "superadmin", "SUPER_ADMIN", "SYSTEM"
            ));

            // Admins
            userRepository.save(createUser(
                    "admin1", "admin1", "ADMIN", "superadmin"
            ));
            userRepository.save(createUser(
                    "admin2", "admin2", "ADMIN", "superadmin"
            ));

            // Users
            userRepository.save(createUser(
                    "user1", "user1", "USER", "admin1"
            ));
            userRepository.save(createUser(
                    "user2", "user2", "USER", "admin1"
            ));
            userRepository.save(createUser(
                    "user3", "user3", "USER", "admin1"
            ));
        };
    }

    private User createUser(String username, String password, String role, String addedBy) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password)); // hashing done
        user.setRole(role);

        user.setName("Test " + username);
        user.setPhone("9000000000");
        user.setEmail(username + "@temple.local");
        user.setDob(LocalDate.of(1990, 1, 1));
        user.setAadhaarLast4("1234");
        user.setAddress("Temple Office, Jamsawli");

        user.setActive(true);
        user.setForcePasswordChange(false);
        user.setDateOfJoining(LocalDate.now());
        user.setAddedBy(addedBy);

        return user;
    }
}
