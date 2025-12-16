package in.temple.backend.service;

import in.temple.backend.model.User;
import in.temple.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

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

    public List<User> getAllUsersForAdmin(User admin) {

        List<User> users = userRepository.findAll();

        // ADMIN cannot see SUPER_ADMIN
        if (admin.getRole().equals("ADMIN")) {
            return users.stream()
                    .filter(u -> !u.getRole().equals("SUPER_ADMIN"))
                    .toList();
        }

        return users;
    }

    public User createUser(User admin, User newUser) {

        // Role validation
        if (admin.getRole().equals("ADMIN") &&
                !newUser.getRole().equals("USER")) {
            throw new RuntimeException("Admin can create only USER");
        }

        if (newUser.getRole().equals("SUPER_ADMIN")) {
            throw new RuntimeException("Cannot create SUPER_ADMIN");
        }

        // Username uniqueness
        userRepository.findByUsername(newUser.getUsername())
                .ifPresent(u -> {
                    throw new RuntimeException("Username already exists");
                });

        // Set system fields
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setForcePasswordChange(true);
        newUser.setDateOfJoining(LocalDate.now());
        newUser.setAddedBy(admin.getUsername());
        newUser.setActive(true);

        return userRepository.save(newUser);
    }

    public User updateUser(User admin, Long userId, User updated) {

        User existing = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ADMIN cannot edit ADMIN / SUPER_ADMIN
        if (admin.getRole().equals("ADMIN") &&
                !existing.getRole().equals("USER")) {
            throw new RuntimeException("Admin cannot edit admin users");
        }

        // Update allowed fields only
        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setDob(updated.getDob());
        existing.setAadhaarLast4(updated.getAadhaarLast4());
        existing.setAddress(updated.getAddress());
        existing.setActive(updated.isActive());

        return userRepository.save(existing);
    }

    public void updateUserStatus(User admin, Long userId, boolean active) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ADMIN restrictions
        if (admin.getRole().equals("ADMIN")) {
            if (!user.getRole().equals("USER")) {
                throw new RuntimeException("Admin cannot change admin status");
            }
        }

        // Never disable SUPER_ADMIN
        if (user.getRole().equals("SUPER_ADMIN")) {
            throw new RuntimeException("Cannot disable Super Admin");
        }

        user.setActive(active);
        userRepository.save(user);
    }




}
