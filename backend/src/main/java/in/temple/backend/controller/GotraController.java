package in.temple.backend.controller;

import in.temple.backend.model.Gotra;
import in.temple.backend.service.GotraService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gotras")
@Validated
public class GotraController {

    private final Logger log = LoggerFactory.getLogger(GotraController.class);
    private final GotraService gotraService;

    public GotraController(GotraService gotraService) {
        this.gotraService = gotraService;
    }

    // DTO for creating Gotra
    public static record CreateGotraRequest(
            @NotBlank String gotraNameHi,
            @NotBlank String gotraNameEn
    ) {}

    // DTO for updating Gotra (Hindi only, English cannot change)
    public static record UpdateGotraRequest(
            @NotBlank String gotraNameHi
    ) {}

    // Create Gotra
    @PostMapping
    public ResponseEntity<Gotra> create(
            @RequestHeader(value = "X-Operator-Id", required = false) String operatorId,
            @Valid @RequestBody CreateGotraRequest req) {

        String createdBy = operatorId == null ? "system" : operatorId;

        Gotra saved = gotraService.createGotra(
                req.gotraNameHi(),
                req.gotraNameEn(),
                createdBy
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // List all Gotras
    @GetMapping
    public ResponseEntity<List<Gotra>> list() {
        return ResponseEntity.ok(gotraService.listAll());
    }

    // Get by English Name (ID)
    @GetMapping("/{id}")
    public ResponseEntity<Gotra> get(@PathVariable("id") String id) {
        return ResponseEntity.ok(gotraService.getById(id));
    }

    // Update Hindi Name ONLY (English = ID cannot change)
    @PutMapping("/{id}")
    public ResponseEntity<Gotra> update(
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateGotraRequest req) {

        Gotra updated = gotraService.updateGotra(id, req.gotraNameHi(), id);
        // Passing 'id' as newEnglish because it's unchanged

        return ResponseEntity.ok(updated);
    }

    // Delete Gotra
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        gotraService.deleteGotra(id);
        return ResponseEntity.noContent().build();
    }
}
