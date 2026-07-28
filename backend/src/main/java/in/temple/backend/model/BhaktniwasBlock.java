package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "bhaktniwas_block",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_bhaktniwas_block_code", columnNames = "code")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BhaktniwasBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(length = 255)
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
