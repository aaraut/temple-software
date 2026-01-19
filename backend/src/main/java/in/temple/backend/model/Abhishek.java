package in.temple.backend.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "abhishek_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Abhishek {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "standard_code", nullable = false, length = 20)
    private String standardCode;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_disabled")
    private Boolean isDisabled = false;

    // audit (aligned with existing style)
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
