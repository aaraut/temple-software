package in.temple.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // SUPER_ADMIN, ADMIN, USER

    private String name;
    private String phone;
    private String email;

    private LocalDate dob;

    @Column(length = 4)
    private String aadhaarLast4;

    private String address;

    private boolean isActive = true;
    private boolean forcePasswordChange = false;

    private LocalDate dateOfJoining;
    private String addedBy;
}
