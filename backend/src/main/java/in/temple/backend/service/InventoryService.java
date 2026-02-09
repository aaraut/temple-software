package in.temple.backend.service;

import in.temple.backend.model.InventoryItem;

import java.util.List;

public interface InventoryService {

    InventoryItem create(InventoryItem item, String username);

    InventoryItem update(Long id, InventoryItem item, String username);

    List<InventoryItem> findByCategory(String category);

    void updateStock(Long itemId,
                     Integer newStock,
                     String actionReason,
                     String username);
}