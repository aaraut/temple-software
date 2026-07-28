package in.temple.backend.service;

import in.temple.backend.dto.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface RoomBookingService {

    String createBooking(RoomBookingCreateRequestDto request);

    byte[] printBookingReceipt(String bookingNumber, String language);

    RoomBookingDetailDto getBookingDetail(String bookingNumber);

    void checkIn(RoomCheckInRequestDto request);

    void checkout(RoomCheckoutRequestDto request);

    String shiftRoom(RoomShiftRequestDto request);

    List<RoomAvailabilityDto> getAvailability(
            LocalDateTime start,
            LocalDateTime end
    );

    List<RoomBookingSummaryDto> searchBookings(
            RoomBookingSearchRequestDto request
    );

    void cancelBooking(RoomBookingCancelRequestDto request);


    OccupancyReportDto getOccupancyReport();
    RevenueReportDto getRevenue(
            String username,
            LocalDateTime start,
            LocalDateTime end);

    List<DailySheetRoomDto> getDailySheet(Long bhaktniwasBlockId, LocalDate date);

    UserCollectionReportDto getUserCollectionReport(String username, LocalDate date);
}
