package in.temple.backend.model;

import in.temple.backend.model.enums.BookingStatus;
import in.temple.backend.model.enums.BookingType;
import in.temple.backend.model.enums.IdProofType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "customer_name", columnDefinition = "varchar(255)")
    private String customerName;

    @Column(name = "mobile_number", columnDefinition = "varchar(20)")
    private String mobileNumber;

    @Column(name = "id_proof_number", columnDefinition = "varchar(50)")
    private String idProofNumber;


    @Enumerated(EnumType.STRING)
    private IdProofType idProofType;

    // private String idProofNumber;

    @Enumerated(EnumType.STRING)
    private BookingType bookingType;

    private LocalDateTime scheduledCheckIn;
    private LocalDateTime scheduledCheckOut;

    private LocalDateTime actualCheckInTime;
    private LocalDateTime actualCheckOutTime;

    private BigDecimal baseAmount;
    private BigDecimal extraSurchargeAmount;
    private BigDecimal extraChargeAmount;
    private BigDecimal grossAmount;

    private BigDecimal securityDeposit;
    private BigDecimal deductionFromDeposit;

    private BigDecimal netPayableAmount;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private Long shiftedFromBookingId;
    private Long shiftedToBookingId;

    private String createdBy;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        status = BookingStatus.BOOKED;
    }
}
