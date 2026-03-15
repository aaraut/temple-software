package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "donation_purpose")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DonationPurpose {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(name = "name_hi", nullable = false)
    private String nameHi;

    // NULL = as per devotion
    @Column(name = "fixed_amount")
    private BigDecimal fixedAmount;

    @Column(name = "requires_gotra", nullable = false)
    private boolean requiresGotra;

    @Column(nullable = false)
    private boolean active;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @Column(name = "receipt_prefix", nullable = false, length = 5)
    private String receiptPrefix;

}
