package in.temple.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
public class RentalReturnRequestDto {

    private String receiptNumber;
    private Double fineAmount;
    private String remarks;
    private String handledBy;

    private List<Item> items;

    @Getter
    @Setter
    public static class Item {
        private Long rentalItemId;
        private Integer returnedQty;
        private Integer damagedQty;
        private Integer missingQty;
    }
}
