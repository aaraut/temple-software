package in.temple.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class RentalDetailsResponseDto {

    private String receiptNumber;
    private String customerName;
    private String mobile;
    private String address;

    private BigDecimal chargedAmount;
    private BigDecimal calculatedTotalAmount;
    private BigDecimal depositAmount;
    private BigDecimal totalFineAmount;
    private String status;

    private List<Item> items;

    @Getter
    @Setter
    public static class Item {

        private Long rentalItemId;   // 🔑 THIS is what Return API needs
        private String itemName;

        private BigDecimal rate;
        private Integer issuedQty;
        private Integer returnedQty;
        private Integer damagedQty;
        private Integer missingQty;

        private Integer remainingQty;
    }
}
