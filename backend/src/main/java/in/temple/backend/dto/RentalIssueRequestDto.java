package in.temple.backend.dto;

import in.temple.backend.model.enums.InventoryCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
public class RentalIssueRequestDto {

    @NotNull
    private InventoryCategory category;

    @NotBlank
    @Size(max = 255)
    private String customerName;

    @NotBlank
    @Size(min = 10, max = 10)
    private String mobile;

    @NotBlank
    @Size(max = 500)
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
