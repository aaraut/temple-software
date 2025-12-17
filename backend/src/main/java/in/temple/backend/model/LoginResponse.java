package in.temple.backend.model;

import lombok.Data;

@Data
public class LoginResponse {
    private String username;
    private String role;
    private boolean forcePasswordChange;
    private String token;
}
