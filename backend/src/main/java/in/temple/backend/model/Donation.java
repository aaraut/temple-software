package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "donation",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_receipt_number",
                        columnNames = "receipt_number"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false)
    private String receiptNumber;

    @Column(nullable = false)
    private String donorName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false, length = 10)
    private String mobile;

    @Column(name = "purpose_id", nullable = false)
    private Long purposeId;

    @Column(name = "purpose_name_en", nullable = false)
    private String purposeNameEn;

    @Column(name = "purpose_name_hi", nullable = false)
    private String purposeNameHi;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_type", nullable = false)
    private String paymentType; // CASH

    /* ---------------- Gotra ---------------- */

    @Column(name = "gotra_id")
    private String gotraId;   // English name (PK of Gotra)

    @Column(name = "gotra_name_en")
    private String gotraNameEn;

    @Column(name = "gotra_name_hi")
    private String gotraNameHi;

    /* ------------------------------------- */

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String createdBy;
}
