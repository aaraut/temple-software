package in.temple.backend.repository;

import in.temple.backend.model.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RentalReportRepository extends JpaRepository<Rental, Long> {

    // REPORT 1 – Pending rentals
    @Query(value = """
        SELECT
            r.receipt_number,
            r.created_at,
            r.category,
            r.customer_name,
            r.mobile,
            r.created_by,
            SUM(ri.issued_qty) AS issued_qty,
            SUM(ri.issued_qty - ri.returned_qty - ri.damaged_qty - ri.missing_qty) AS pending_qty,
            r.deposit_amount,
            r.total_fine_amount,
            r.status
        FROM rental r
        JOIN rental_item ri ON r.id = ri.rental_id
        WHERE r.status IN ('ISSUED','PARTIALLY_RETURNED')
        GROUP BY r.id
        """, nativeQuery = true)
    List<Object[]> fetchPendingRentalsRaw();

    // REPORT 4 – Summary
    @Query(value = """
        SELECT
            r.created_by,
            COUNT(*) AS total_rentals,
            SUM(r.calculated_total_amount),
            SUM(r.charged_amount),
            SUM(r.total_fine_amount),
            SUM(r.deposit_amount),
            SUM(r.total_refund_amount)
        FROM rental r
        GROUP BY r.created_by
        """, nativeQuery = true)
    List<Object[]> fetchRentalSummaryRaw();


    @Query(value = """
    SELECT
        r.receipt_number,
        r.created_at,
        r.category,
        r.customer_name,
        r.mobile,
        SUM(ri.issued_qty) AS issued_qty,
        SUM(ri.issued_qty - ri.returned_qty - ri.damaged_qty - ri.missing_qty) AS pending_qty,
        r.calculated_total_amount,
        r.charged_amount,
        r.deposit_amount,
        r.total_fine_amount,
        r.status
    FROM rental r
    JOIN rental_item ri ON r.id = ri.rental_id
    WHERE r.created_by = :createdBy
    GROUP BY r.id
    ORDER BY r.created_at DESC
""", nativeQuery = true)
    List<Object[]> fetchMyRentalEntriesRaw(String createdBy);

}
