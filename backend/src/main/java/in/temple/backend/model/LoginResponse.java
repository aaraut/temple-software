package in.temple.backend.model;

import lombok.Data;

import java.util.Map;

@Data
public class LoginResponse {
    private String username;
    private String role;
    private boolean forcePasswordChange;
    private String token;
    private Map<String, Boolean> moduleAccess;
}
