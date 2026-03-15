package in.temple.backend.model;

import in.temple.backend.model.enums.CleaningStatus;
import in.temple.backend.model.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "room",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_room_number",
                        columnNames = "room_number"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false)
    private String roomNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private RoomCategory category;

    private String blockName;
    private String floor;

    private Integer maxOccupancy;

    private BigDecimal baseRent24Hr;
    private BigDecimal baseRentFixed;
    private BigDecimal baseRent3Hr;
    private BigDecimal baseRent6Hr;

    private BigDecimal defaultSecurityDeposit;

    @Enumerated(EnumType.STRING)
    private RoomStatus status;

    @Enumerated(EnumType.STRING)
    private CleaningStatus cleaningStatus;

    private Boolean isActive = true;

    private String remarks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        status = RoomStatus.AVAILABLE;
        cleaningStatus = CleaningStatus.CLEAN;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
