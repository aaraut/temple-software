package in.temple.backend.dto;

import in.temple.backend.model.enums.InventoryCategory;
import lombok.*;

import java.util.List;

@Getter
@Setter
public class RentalIssueRequestDto {

    private InventoryCategory category;

    private String customerName;
    private String mobile;
    private String address;
    private String aadhaar;

    private List<Item> items;

    private Double calculatedTotalAmount;
    private Double chargedAmount;
    private Double depositAmount;

    private String createdBy;

    @Getter
    @Setter
    public static class Item {
        private Long inventoryItemId;
        private Integer quantity;
    }
}
