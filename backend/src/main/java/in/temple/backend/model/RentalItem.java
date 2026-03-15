package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rental_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long rentalId;

    private Long inventoryItemId;
    private String itemNameSnapshot;
    private BigDecimal rateAtIssue;

    private Integer issuedQty;
    private Integer returnedQty;
    private Integer damagedQty;
    private Integer missingQty;
}
