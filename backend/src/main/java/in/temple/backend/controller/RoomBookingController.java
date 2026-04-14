package in.temple.backend.controller;

import in.temple.backend.dto.*;
import in.temple.backend.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingService bookingService;

    @PostMapping
    public String createBooking(@RequestBody RoomBookingCreateRequestDto request) {
        return bookingService.createBooking(request);
    }

    @GetMapping(value = "/{bookingNumber}/print", produces = "application/pdf")
    public org.springframework.http.ResponseEntity<byte[]> printBookingReceipt(
            @PathVariable String bookingNumber) {
        byte[] pdf = bookingService.printBookingReceipt(bookingNumber);
        return org.springframework.http.ResponseEntity.ok()
                .header("Content-Disposition", "inline; filename=room-receipt-" + bookingNumber + ".pdf")
                .body(pdf);
    }

    @GetMapping("/{bookingNumber}")
    public RoomBookingDetailDto getBookingDetail(@PathVariable String bookingNumber) {
        return bookingService.getBookingDetail(bookingNumber);
    }

    @PostMapping("/check-in")
    public void checkIn(@RequestBody RoomCheckInRequestDto request) {
        bookingService.checkIn(request);
    }

    @PostMapping("/checkout")
    public void checkout(@RequestBody RoomCheckoutRequestDto request) {
        bookingService.checkout(request);
    }

    @PostMapping("/shift")
    public String shiftRoom(@RequestBody RoomShiftRequestDto request) {
        return bookingService.shiftRoom(request);
    }

    @GetMapping("/availability")
    public List<RoomAvailabilityDto> getAvailability(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {

        return bookingService.getAvailability(start, end);
    }

    @PostMapping("/search")
    public List<RoomBookingSummaryDto> searchBookings(
            @RequestBody RoomBookingSearchRequestDto request) {
        return bookingService.searchBookings(request);
    }


    @PostMapping("/cancel")
    public void cancelBooking(
            @RequestBody RoomBookingCancelRequestDto request) {
        bookingService.cancelBooking(request);
    }

    @GetMapping("/dashboard/occupancy")
    public OccupancyReportDto getOccupancy() {
        return bookingService.getOccupancyReport();
    }

    @GetMapping("/reports/revenue")
    public RevenueReportDto getRevenue(
            @RequestParam(required = false) String username,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end
    ) {
        return bookingService.getRevenue(username, start, end);
    }





}
