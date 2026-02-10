import axiosClient from "./axiosClient";

export const issueRental = (payload) =>
  axiosClient.post("/rentals/issue", payload);

export const getRentalByReceipt = (receiptNumber) =>
  axiosClient.get(`/rentals/${receiptNumber}`);


/**
 * Return rental items (partial or full)
 */
export const returnRental = (payload) =>
  axiosClient.post("/rentals/return", payload);