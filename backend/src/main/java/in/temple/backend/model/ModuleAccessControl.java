package in.temple.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "module_access_control")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleAccessControl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "module_key", nullable = false, unique = true)
    private String moduleKey;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "enabled_for_admin", nullable = false)
    private boolean enabledForAdmin;

    @Column(name = "enabled_for_user", nullable = false)
    private boolean enabledForUser;

}
