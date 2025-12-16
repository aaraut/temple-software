package in.temple.backend.service;

import in.temple.backend.model.AuditLog;
import in.temple.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(String action, String performedBy, String targetUser, String remarks) {

        AuditLog log = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .targetUser(targetUser)
                .timestamp(LocalDateTime.now())
                .remarks(remarks)
                .build();

        auditLogRepository.save(log);
    }
}
