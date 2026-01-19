package in.temple.backend.model;

import in.temple.backend.model.enums.TransactionType;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, unique = true)
    private String receiptNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "language_code", length = 5)
    private String languageCode = "HI";

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String mobileNumber;

    private String address;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "payment_mode")
    private String paymentMode = "CASH";

    private String status = "ACTIVE";

    @Column(name = "is_disabled")
    private Boolean isDisabled = false;

    // audit
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
