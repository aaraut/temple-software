import axiosClient from "./axiosClient";

/* ---------- CREATE ---------- */
export const createBooking = (data) =>
  axiosClient.post("/room-bookings", data);

/* ---------- CREATE AND PRINT ---------- */
export const createBookingAndPrint = (data) =>
  axiosClient.post("/room-bookings/create-and-print", data, {
    responseType: "blob",
  });

/* ---------- CHECK-IN ---------- */
export const checkInBooking = (data) =>
  axiosClient.post("/room-bookings/check-in", data);

/* ---------- CHECKOUT ---------- */
export const checkoutBooking = (data) =>
  axiosClient.post("/room-bookings/checkout", data);

/* ---------- CANCEL ---------- */
export const cancelBooking = (data) =>
  axiosClient.post("/room-bookings/cancel", data);

/* ---------- SHIFT ---------- */
export const shiftRoom = (data) =>
  axiosClient.post("/room-bookings/shift", data);

/* ---------- AVAILABILITY ---------- */
export const getAvailability = (start, end) =>
  axiosClient.get("/room-bookings/availability", {
    params: { start, end },
  });

/* ---------- SEARCH ---------- */
export const searchBookings = (data) =>
  axiosClient.post("/room-bookings/search", data);

/* ---------- OCCUPANCY ---------- */
export const getOccupancy = () =>
  axiosClient.get("/room-bookings/dashboard/occupancy");

/* ---------- REVENUE REPORT ---------- */
export const getRevenueReport = (username, start, end) =>
  axiosClient.get("/room-bookings/reports/revenue", {
    params: { username, start, end },
  });
/* ---------- PRINT RECEIPT ---------- */
export const printBookingReceipt = (bookingNumber) =>
  axiosClient.get(`/room-bookings/${encodeURIComponent(bookingNumber)}/print`, {
    responseType: "blob",
  });

/* ---------- GET BOOKING DETAIL ---------- */
export const getBookingDetail = (bookingNumber) =>
  axiosClient.get(`/room-bookings/${encodeURIComponent(bookingNumber)}`);
