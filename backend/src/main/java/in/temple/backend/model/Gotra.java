package in.temple.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "gotra")
public class Gotra {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;   // English name as ID

    @Column(name = "english_name", nullable = false, unique = true)
    private String englishName;

    @Column(name = "hindi_name", nullable = false)
    private String hindiName;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Gotra() {}

    public Gotra(String englishName, String hindiName, String createdBy) {
        this.id = englishName;
        this.englishName = englishName;
        this.hindiName = hindiName;
        this.createdBy = createdBy;
    }

    // getters & setters
    public String getId() { return id; }
    public String getEnglishName() { return englishName; }
    public void setEnglishName(String englishName) { this.englishName = englishName; }
    public String getHindiName() { return hindiName; }
    public void setHindiName(String hindiName) { this.hindiName = hindiName; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
