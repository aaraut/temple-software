package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "damaged_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DamagedInventory {

    @Id
    private Long inventoryItemId;

    private Integer totalDamagedQty;
    private LocalDateTime lastUpdatedAt;
}
