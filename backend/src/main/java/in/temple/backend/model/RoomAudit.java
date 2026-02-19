package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;

    private String action; // CREATE, UPDATE, CLEANING_STATUS_UPDATE

    @Column(length = 2000)
    private String details;

    private String performedBy;

    private LocalDateTime performedAt;

    @PrePersist
    public void prePersist() {
        performedAt = LocalDateTime.now();
    }
}
