package in.temple.backend.model;

import in.temple.backend.model.enums.InventoryCategory;
import in.temple.backend.model.enums.RentalStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rental")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String receiptNumber;

    @Enumerated(EnumType.STRING)
    private InventoryCategory category;

    private String customerName;
    private String mobile;
    private String address;
    private String aadhaar;

    private BigDecimal calculatedTotalAmount;
    private BigDecimal chargedAmount;
    private BigDecimal depositAmount;

    private BigDecimal totalFineAmount;
    private BigDecimal totalRefundAmount;

    @Enumerated(EnumType.STRING)
    private RentalStatus status;

    private String createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        totalFineAmount = BigDecimal.ZERO;
        totalRefundAmount = BigDecimal.ZERO;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
