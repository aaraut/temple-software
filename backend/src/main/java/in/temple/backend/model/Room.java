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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bhaktniwas_block_id", nullable = false)
    private BhaktniwasBlock bhaktniwasBlock;

    private String floor;

    private Integer maxOccupancy;

    private BigDecimal baseRent24Hr;
    private BigDecimal baseRentFixed;
    private BigDecimal baseRent3Hr;
    private BigDecimal baseRent6Hr;

    private BigDecimal defaultSecurityDeposit;

    @Column(name = "allow_extra_person", nullable = false)
    private Boolean allowExtraPerson = false;

    @Column(name = "extra_person_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal extraPersonCost = BigDecimal.ZERO;

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
        if (defaultSecurityDeposit == null) defaultSecurityDeposit = BigDecimal.ZERO;
        if (allowExtraPerson == null) allowExtraPerson = false;
        if (extraPersonCost == null) extraPersonCost = BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
