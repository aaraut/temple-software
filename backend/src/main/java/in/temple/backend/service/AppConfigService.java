package in.temple.backend.service;

import in.temple.backend.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppConfigService {

    private final AppConfigRepository appConfigRepository;

    public int getInt(String key, int defaultValue) {
        return appConfigRepository.findById(key)
                .map(c -> {
                    try {
                        return Integer.parseInt(c.getConfigValue().trim());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        return appConfigRepository.findById(key)
                .map(c -> Boolean.parseBoolean(c.getConfigValue().trim()))
                .orElse(defaultValue);
    }

    public String getString(String key, String defaultValue) {
        return appConfigRepository.findById(key)
                .map(c -> c.getConfigValue())
                .orElse(defaultValue);
    }
}
