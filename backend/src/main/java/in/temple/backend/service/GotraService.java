package in.temple.backend.service;

import in.temple.backend.error.NotFoundException;
import in.temple.backend.model.Gotra;
import in.temple.backend.repository.GotraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GotraService {

    private final Logger log = LoggerFactory.getLogger(GotraService.class);
    private final GotraRepository gotraRepository;

    public GotraService(GotraRepository gotraRepository) {
        this.gotraRepository = gotraRepository;
    }

    public Gotra createGotra(String hindiName, String englishName, String createdBy) {

        // Check if English name already exists (ID = English)
        if (gotraRepository.existsByEnglishName(englishName)) {
            throw new RuntimeException("Gotra already exists with English name: " + englishName);
        }

        Gotra g = new Gotra(englishName, hindiName, createdBy);
        return gotraRepository.save(g);
    }

    public Gotra getById(String id) {
        return gotraRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Gotra not found: " + id));
    }

    public List<Gotra> listAll() {
        return gotraRepository.findAll();
    }

    public Gotra updateGotra(String id, String newHindi, String newEnglish) {

        Gotra existing = getById(id);

        // Check if English name changed → but English = ID, so cannot change
        if (!existing.getEnglishName().equals(newEnglish)) {
            throw new RuntimeException("Cannot change English name. English name is the ID!");
        }

        existing.setHindiName(newHindi);

        Gotra updated = gotraRepository.save(existing);

        log.info("Updated gotra id={}", id);

        return updated;
    }

    public void deleteGotra(String id) {

        if (!gotraRepository.existsById(id)) {
            throw new NotFoundException("Gotra not found: " + id);
        }

        gotraRepository.deleteById(id);

        log.info("Deleted gotra id={}", id);
    }
}
