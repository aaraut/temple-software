package in.temple.backend.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ForgotPasswordRequest {
    private String username;
    private LocalDate dob;
    private String aadhaarLast4;
    private String newPassword;
}
