package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "upi_donation",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_upi_donation_receipt_number",
                        columnNames = "receipt_number"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpiDonation {

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

    // Last 4 digits of the UPI payment's reference/UTR number — printed on the
    // receipt as "XXXX1234" so the counter has proof of which payment it matches,
    // without needing the donor's full UTR.
    @Column(name = "payment_ref_last4", nullable = false, length = 4)
    private String paymentRefLast4;

    /* ---------------- Gotra ---------------- */

    @Column(name = "gotra_id")
    private String gotraId;

    @Column(name = "gotra_name_en")
    private String gotraNameEn;

    @Column(name = "gotra_name_hi")
    private String gotraNameHi;

    /* ------------------------------------- */

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private Boolean active = true;
}
