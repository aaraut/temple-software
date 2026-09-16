package in.temple.backend.repository;

import in.temple.backend.model.UpiDonation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UpiDonationRepository extends JpaRepository<UpiDonation, Long> {

    // Own sequence, separate from receipt_sequence used by donation/rental/room
    // booking — so UPI bill numbering never collides with or depends on those.
    @Query(value = "SELECT nextval('upi_donation_seq')", nativeQuery = true)
    Long nextReceiptSequence();

    List<UpiDonation> findByActiveTrueAndMobileOrderByCreatedAtDesc(String mobile);

    List<UpiDonation> findByActiveTrueAndReceiptNumberOrderByCreatedAtDesc(String receiptNumber);

    List<UpiDonation> findByActiveTrueOrderByCreatedAtDesc();
}
