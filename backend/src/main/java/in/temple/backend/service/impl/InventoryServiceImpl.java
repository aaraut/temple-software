package in.temple.backend.service.impl;


import com.fasterxml.jackson.databind.ObjectMapper;
import in.temple.backend.model.InventoryItem;
import in.temple.backend.model.InventoryItemAudit;
import in.temple.backend.repository.InventoryItemAuditRepository;
import in.temple.backend.repository.InventoryItemRepository;
import in.temple.backend.service.InventoryService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final InventoryItemRepository itemRepository;
    private final InventoryItemAuditRepository auditRepository;
    private final ObjectMapper objectMapper;

    public InventoryServiceImpl(InventoryItemRepository itemRepository,
                                InventoryItemAuditRepository auditRepository,
                                ObjectMapper objectMapper) {
        this.itemRepository = itemRepository;
        this.auditRepository = auditRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public InventoryItem create(InventoryItem item, String username) {
        InventoryItem saved = itemRepository.save(item);

        writeAudit(
                saved.getId(),
                "CREATE",
                username,
                null,
                toJson(saved)
        );

        return saved;
    }

    @Override
    public InventoryItem update(Long id, InventoryItem item, String username) {
        InventoryItem existing = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        String oldJson = toJson(existing);

        existing.setCategory(item.getCategory());
        existing.setMaterialNameHi(item.getMaterialNameHi());
        existing.setUnit(item.getUnit());
        existing.setRate(item.getRate());
        existing.setTotalStock(item.getTotalStock());
        existing.setIsActive(item.getIsActive());

        InventoryItem saved = itemRepository.save(existing);

        writeAudit(
                saved.getId(),
                "UPDATE",
                username,
                oldJson,
                toJson(saved)
        );

        return saved;
    }

    @Override
    public List<InventoryItem> findByCategory(String category) {
        return itemRepository.findByCategoryAndIsActiveTrue(category);
    }

    @Override
    public void updateStock(Long itemId,
                            Integer newStock,
                            String actionReason,
                            String username) {

        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        String oldJson = toJson(item);

        item.setTotalStock(newStock);
        InventoryItem saved = itemRepository.save(item);

        writeAudit(
                saved.getId(),
                "STOCK_CHANGE_" + actionReason,
                username,
                oldJson,
                toJson(saved)
        );
    }

    /* -------------------- AUDIT -------------------- */

    private void writeAudit(Long itemId,
                            String action,
                            String username,
                            String oldValue,
                            String newValue) {

        InventoryItemAudit audit = new InventoryItemAudit();
        audit.setInventoryItemId(itemId);
        audit.setAction(action);
        audit.setChangedBy(username);
        audit.setOldValue(oldValue);
        audit.setNewValue(newValue);

        auditRepository.save(audit);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON conversion failed", e);
        }
    }
}