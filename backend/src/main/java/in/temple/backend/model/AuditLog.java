package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;        // CREATE_USER, UPDATE_USER, RESET_PASSWORD, STATUS_CHANGE
    private String performedBy;   // admin username
    private String targetUser;    // affected username

    private LocalDateTime timestamp;

    private String remarks;
}
