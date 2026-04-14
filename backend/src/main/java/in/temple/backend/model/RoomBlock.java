package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_block")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "block_from", nullable = false)
    private LocalDateTime blockFrom;

    @Column(name = "block_to", nullable = false)
    private LocalDateTime blockTo;

    @Column(name = "reason")
    private String reason;

    @Column(name = "blocked_by", nullable = false)
    private String blockedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;   // false = unblocked

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        active = true;
    }
}
