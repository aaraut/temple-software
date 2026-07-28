package in.temple.backend.model;

import in.temple.backend.model.enums.PricingType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_type", nullable = false, length = 20)
    private PricingType pricingType;

    @PrePersist
    public void prePersist() {
        if (pricingType == null) pricingType = PricingType.FIXED;
        if (isActive == null) isActive = true;
    }
}
