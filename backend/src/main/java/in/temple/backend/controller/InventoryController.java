package in.temple.backend.controller;

import in.temple.backend.model.InventoryItem;
import in.temple.backend.service.InventoryService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Create inventory item (BARTAN / BICHAYAT)
     */
    @PostMapping("/item")
    public InventoryItem createItem(@RequestBody InventoryItem item) {
        // username handling same as donation module
        return inventoryService.create(item, "SYSTEM");
    }

    /**
     * Update inventory item
     */
    @PutMapping("/item/{id}")
    public InventoryItem updateItem(@PathVariable Long id,
                                    @RequestBody InventoryItem item) {
        return inventoryService.update(id, item, "SYSTEM");
    }

    /**
     * List inventory items by category
     * Example: /api/inventory/items?category=BARTAN
     */
    @GetMapping("/items")
    public List<InventoryItem> getItems(@RequestParam String category) {
        return inventoryService.findByCategory(category);
    }
}