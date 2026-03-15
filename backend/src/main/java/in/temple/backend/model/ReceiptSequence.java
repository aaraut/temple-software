package in.temple.backend.model;

import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name = "receipt_sequence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptSequence {

    @Id
    private Integer id = 1;

    @Column(name = "last_sequence", nullable = false)
    private Long lastSequence;

    @Version
    @Column(nullable = false)
    private Long version = 0L;
}

