package in.temple.backend.controller;

import in.temple.backend.model.Gotra;
import in.temple.backend.model.User;
import in.temple.backend.service.AuthContextService;
import in.temple.backend.service.GotraService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuthContextService authContextService;

    public GotraController(GotraService gotraService,
                           AuthContextService authContextService) {
        this.gotraService = gotraService;
        this.authContextService = authContextService;
    }

    // ---------- DTOs ----------

    public static record CreateGotraRequest(
            @NotBlank String gotraNameHi,
            @NotBlank String gotraNameEn
    ) {}

    public static record UpdateGotraRequest(
            @NotBlank String gotraNameHi
    ) {}

    // ---------- APIs ----------

    // Create Gotra (ADMIN / SUPER_ADMIN)
    @PostMapping
    public ResponseEntity<Gotra> create(
            HttpServletRequest request,
            @Valid @RequestBody CreateGotraRequest req) {

        User user = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(user, "ADMIN", "SUPER_ADMIN");

        log.info("Creating gotra by {}", user.getUsername());

        Gotra saved = gotraService.createGotra(
                req.gotraNameHi(),
                req.gotraNameEn(),
                user.getUsername()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // List all Gotras (Any logged-in user)
    @GetMapping
    public ResponseEntity<List<Gotra>> list(HttpServletRequest request) {

        // JWT already validated by interceptor
        request.getAttribute("loggedInUser");

        return ResponseEntity.ok(gotraService.listAll());
    }

    // Get Gotra by ID (Any logged-in user)
    @GetMapping("/{id}")
    public ResponseEntity<Gotra> get(
            HttpServletRequest request,
            @PathVariable("id") String id) {

        request.getAttribute("loggedInUser");

        return ResponseEntity.ok(gotraService.getById(id));
    }

    // Update Gotra (ADMIN / SUPER_ADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<Gotra> update(
            HttpServletRequest request,
            @PathVariable("id") String id,
            @Valid @RequestBody UpdateGotraRequest req) {

        User user = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(user, "ADMIN", "SUPER_ADMIN");

        log.info("Updating gotra {} by {}", id, user.getUsername());

        Gotra updated = gotraService.updateGotra(
                id,
                req.gotraNameHi(),
                id // English name (ID) unchanged
        );

        return ResponseEntity.ok(updated);
    }

    // Delete Gotra (SUPER_ADMIN only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            HttpServletRequest request,
            @PathVariable("id") String id) {

        User user = (User) request.getAttribute("loggedInUser");
        authContextService.requireRole(user, "SUPER_ADMIN");

        log.warn("Deleting gotra {} by {}", id, user.getUsername());

        gotraService.deleteGotra(id);
        return ResponseEntity.noContent().build();
    }
}
