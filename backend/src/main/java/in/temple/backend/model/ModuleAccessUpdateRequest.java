package in.temple.backend.model;

import lombok.Data;

@Data
public class ModuleAccessUpdateRequest {
    private boolean enabledForAdmin;
    private boolean enabledForUser;
}
