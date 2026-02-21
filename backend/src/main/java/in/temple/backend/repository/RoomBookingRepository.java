package in.temple.backend.repository;

import in.temple.backend.model.RoomBooking;
import in.temple.backend.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {

    List<RoomBooking> findByRoomIdAndStatusIn(
            Long roomId,
            List<BookingStatus> statuses
    );

    boolean existsByBookingNumber(String bookingNumber);

    Optional<RoomBooking> findByBookingNumber(String bookingNumber);

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

    @Query("""
        SELECT COUNT(rb) > 0
        FROM RoomBooking rb
        WHERE rb.room.id = :roomId
        AND rb.status IN ('BOOKED','CHECKED_IN')
        AND (
            :start < rb.scheduledCheckOut
            AND :end > rb.scheduledCheckIn
        )
        """)
    boolean isRoomOccupied(
            @Param("roomId") Long roomId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

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
    






}
