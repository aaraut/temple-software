package in.temple.backend.controller;

import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.Amenity;
import in.temple.backend.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityRepository repository;

    @PostMapping
    public Amenity create(@RequestBody Amenity amenity) {
        return repository.save(amenity);
    }

    @GetMapping
    public List<Amenity> getAll() {
        return repository.findAll();
    }

    @PutMapping("/{id}")
    public Amenity update(@PathVariable Long id,
                          @RequestBody Amenity amenity) {

        Amenity existing = repository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException("Amenity not found with id: " + id)
                );

        existing.setName(amenity.getName());
        existing.setIsActive(amenity.getIsActive());

        return repository.save(existing);
    }
}

