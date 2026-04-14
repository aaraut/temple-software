package in.temple.backend.repository;

import in.temple.backend.model.RoomBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomBlockRepository extends JpaRepository<RoomBlock, Long> {

    /**
     * Check if a room has an active block overlapping the given period.
     */
    @Query("""
        SELECT COUNT(rb) > 0 FROM RoomBlock rb
        WHERE rb.roomId = :roomId
        AND rb.active = true
        AND rb.blockFrom < :periodEnd
        AND rb.blockTo > :periodStart
    """)
    boolean isRoomBlockedForPeriod(
            @Param("roomId") Long roomId,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    /**
     * Get active blocks for a room overlapping the given period.
     */
    @Query("""
        SELECT rb FROM RoomBlock rb
        WHERE rb.roomId = :roomId
        AND rb.active = true
        AND rb.blockFrom < :periodEnd
        AND rb.blockTo > :periodStart
    """)
    List<RoomBlock> findActiveBlocksForPeriod(
            @Param("roomId") Long roomId,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    /**
     * Deactivate (unblock) all active blocks for given rooms overlapping period.
     */
    @Modifying
    @Query("""
        UPDATE RoomBlock rb SET rb.active = false
        WHERE rb.roomId IN :roomIds
        AND rb.active = true
        AND rb.blockFrom < :periodEnd
        AND rb.blockTo > :periodStart
    """)
    void deactivateBlocksForPeriod(
            @Param("roomIds") List<Long> roomIds,
            @Param("periodStart") LocalDateTime periodStart,
            @Param("periodEnd") LocalDateTime periodEnd
    );

    /**
     * Get the latest active block for a room (for display in availability).
     */
    @Query(value = """
        SELECT * FROM room_block
        WHERE room_id = :roomId AND active = true
        ORDER BY block_from DESC LIMIT 1
    """, nativeQuery = true)
    java.util.Optional<RoomBlock> findLatestActiveBlock(@Param("roomId") Long roomId);
}
