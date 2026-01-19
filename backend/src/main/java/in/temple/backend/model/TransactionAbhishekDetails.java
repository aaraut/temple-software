package in.temple.backend.model;

import in.temple.backend.model.enums.OccurrenceType;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_abhishek_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionAbhishekDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @ManyToOne
    @JoinColumn(name = "gotra_id", nullable = false)
    private Gotra gotra;

    @ManyToOne
    @JoinColumn(name = "abhishek_id", nullable = false)
    private Abhishek abhishek;

    private LocalDate fromDate;
    private LocalDate toDate;

    @Enumerated(EnumType.STRING)
    private OccurrenceType occurrenceType;

    private Integer duration;

    private BigDecimal amountPerUnit;
    private BigDecimal calculatedAmount;

    // audit
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
