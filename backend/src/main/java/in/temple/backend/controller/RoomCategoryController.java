package in.temple.backend.controller;

import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.RoomCategory;
import in.temple.backend.repository.RoomCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/room-categories")
@RequiredArgsConstructor
public class RoomCategoryController {

    private final RoomCategoryRepository repository;

    @PostMapping
    public RoomCategory create(@RequestBody RoomCategory category) {
        return repository.save(category);
    }

    @GetMapping
    public List<RoomCategory> getAll() {
        return repository.findAll();
    }

    @PutMapping("/{id}")
    public RoomCategory update(@PathVariable Long id,
                               @RequestBody RoomCategory category) {

        RoomCategory existing = repository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException("Room category not found with id: " + id)
                );

        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        existing.setIsActive(category.getIsActive());

        return repository.save(existing);
    }
}
