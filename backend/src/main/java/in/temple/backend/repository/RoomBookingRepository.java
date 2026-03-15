package in.temple.backend.repository;

import in.temple.backend.dto.RevenueReportDto;
import in.temple.backend.model.RoomBooking;
import in.temple.backend.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {

    /* ==============================
       BASIC METHODS
       ============================== */

    List<RoomBooking> findByRoomIdAndStatusIn(
            Long roomId,
            List<BookingStatus> statuses
    );

    boolean existsByBookingNumber(String bookingNumber);

    Optional<RoomBooking> findByBookingNumber(String bookingNumber);


    /* ==============================
       OVERLAP CHECK
       ============================== */

    @Query("""
        SELECT COUNT(rb) > 0
        FROM RoomBooking rb
        WHERE rb.room.id = :roomId
        AND rb.status IN :statuses
        AND (
            :newStart < rb.scheduledCheckOut
            AND :newEnd > rb.scheduledCheckIn
        )
    """)
    boolean existsOverlappingBooking(
            @Param("roomId") Long roomId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd
    );


    /* ==============================
       OCCUPANCY CHECK
       ============================== */

    @Query("""
SELECT COUNT(rb) > 0
FROM RoomBooking rb
WHERE rb.room.id = :roomId
AND rb.status IN ('BOOKED','CHECKED_IN')
AND rb.scheduledCheckOut > :start
AND rb.scheduledCheckIn < :end
""")
    boolean isRoomOccupied(
            @Param("roomId") Long roomId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );


    /* ==============================
       SEARCH (NATIVE)
       ============================== */

    @Query(value = """
        SELECT *
        FROM room_booking rb
        WHERE (rb.booking_number = COALESCE(:bookingNumber, rb.booking_number))
        AND (rb.customer_name ILIKE CONCAT('%', COALESCE(:customerName, ''), '%'))
        AND (rb.mobile_number = COALESCE(:mobile, rb.mobile_number))
        AND (rb.status = COALESCE(:status, rb.status))
        AND (rb.scheduled_check_in >= COALESCE(:fromDate, rb.scheduled_check_in))
        AND (rb.scheduled_check_in <= COALESCE(:toDate, rb.scheduled_check_in))
        """, nativeQuery = true)
    List<RoomBooking> searchBookings(
            @Param("bookingNumber") String bookingNumber,
            @Param("customerName") String customerName,
            @Param("mobile") String mobile,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );


    /* ==============================
       DASHBOARD - OCCUPANCY
       ============================== */

    @Query("""
        SELECT COUNT(rb)
        FROM RoomBooking rb
        WHERE rb.status = 'CHECKED_IN'
    """)
    Long countOccupiedRooms();


    @Query("""
        SELECT COUNT(r)
        FROM Room r
        WHERE r.isActive = true
    """)
    Long countActiveRooms();


    /* ==============================
   REVENUE REPORT
   ============================== */

    /* ==============================
   REVENUE REPORT (SAFE VERSION)
   ============================== */

    @Query("""
    SELECT
        COALESCE(SUM(rb.grossAmount), 0),
        COALESCE(SUM(rb.securityDeposit), 0),
        COALESCE(SUM(rb.deductionFromDeposit), 0)
    FROM RoomBooking rb
    WHERE (:username IS NULL OR rb.createdBy = :username)
    AND rb.status IN ('CHECKED_IN','CHECKED_OUT','CANCELLED')
    AND rb.scheduledCheckIn BETWEEN :start AND :end
""")
    List<Object[]> getRevenueRaw(
            @Param("username") String username,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

}