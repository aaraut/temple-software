package in.temple.backend.repository;

import in.temple.backend.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DonationRepository
        extends JpaRepository<Donation, Long> {

    /* -------------------------------------------------
       Search ACTIVE donations (User + Admin view)
       ------------------------------------------------- */
    List<Donation> findByActiveTrueOrderByCreatedAtDesc();

    List<Donation> findByActiveTrueAndReceiptNumberOrderByCreatedAtDesc(
            String receiptNumber
    );

    List<Donation> findByActiveTrueAndMobileOrderByCreatedAtDesc(
            String mobile
    );

    List<Donation> findByActiveTrueAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from,
            LocalDateTime to
    );

    List<Donation> findByActiveTrueAndReceiptNumberAndMobileAndCreatedAtBetweenOrderByCreatedAtDesc(
            String receiptNumber,
            String mobile,
            LocalDateTime from,
            LocalDateTime to
    );


    /* -------------------------------------------------
       Search INACTIVE donations (Admin tab later)
       ------------------------------------------------- */
    List<Donation> findByActiveFalseOrderByCreatedAtDesc();

    List<Donation> findByActiveFalseAndReceiptNumberOrderByCreatedAtDesc(
            String receiptNumber
    );

    List<Donation> findByActiveFalseAndMobileOrderByCreatedAtDesc(
            String mobile
    );

    List<Donation> findByActiveFalseAndCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from,
            LocalDateTime to
    );

    List<Donation> findByCreatedAtBetweenAndActiveTrue(
            LocalDateTime start,
            LocalDateTime end
    );

    List<Donation> findByCreatedAtBetweenAndCreatedByAndActiveTrue(
            LocalDateTime start,
            LocalDateTime end,
            String createdBy
    );

    List<Donation> findByActiveTrueAndPurposeNameEnAndCreatedAtBetweenAndCreatedByOrderByCreatedAtDesc(
            String purposeNameEn,
            LocalDateTime start,
            LocalDateTime end,
            String createdBy
    );

    List<Donation> findByActiveTrueAndPurposeNameEnAndCreatedAtBetweenOrderByCreatedAtDesc(
            String purposeNameEn,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Donation> findByActiveTrueAndMobileContainingIgnoreCaseOrderByCreatedAtDesc(String mobile);

    List<Donation> findByActiveTrueAndDonorNameContainingIgnoreCaseOrderByCreatedAtDesc(String donorName);

}
