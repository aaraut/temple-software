import axiosClient from "./axiosClient";

export const getPendingRentals = (params) =>
  axiosClient.get("/reports/rentals/pending", { params });

export const getMyRentalSummary = (params) =>
  axiosClient.get("/reports/rentals/summary/user", { params });

export const getAdminRentalSummary = (params) =>
  axiosClient.get("/reports/rentals/summary/admin", { params });

export const getMyRentalEntries = (params) =>
  axiosClient.get("/reports/rentals/my-entries", { params });

