import axiosClient from "./axiosClient";

/**
 * Reuse donation search to pre-fill customer name + address.
 * Searches by mobile — returns DonationListItemDto list.
 * No new backend endpoint needed.
 */
export async function searchDonorByMobile(mobile) {
  const resp = await axiosClient.post("/donation/search", { mobile });
  return resp.data; // DonationListItemDto[]
}

/**
 * Issue rental (only save – optional if still needed somewhere)
 */
export async function issueRental(payload) {
  const resp = await axiosClient.post(
    "/rentals/issue",
    payload
  );
  return resp.data;
}

/**
 * ✅ NEW: Save & Print Rental
 */
export async function createRentalAndPrint(payload, username) {
  const resp = await axiosClient.post(
    `/rentals/create-and-print?username=${encodeURIComponent(username)}`,
    payload,
    {
      responseType: "blob"   // 🔥 VERY IMPORTANT (same as donation)
    }
  );

  return resp.data; // This will be Blob (PDF)
}

/**
 * Search rentals by mobile number
 */
export async function searchRentalsByMobile(mobile) {
  const resp = await axiosClient.get(`/rentals/search/mobile`, { params: { mobile } });
  return resp.data;
}

/**
 * Search rentals by customer name (partial match)
 */
export async function searchRentalsByName(name) {
  const resp = await axiosClient.get(`/rentals/search/name`, { params: { name } });
  return resp.data;
}

/**
 * Get rental by receipt
 */
export async function getRentalByReceipt(receiptNumber) {
  const resp = await axiosClient.get(
    `/rentals/${receiptNumber}`
  );
  return resp.data;
}

/**
 * Return rental items (partial or full)
 */
export async function returnRental(payload) {
  const resp = await axiosClient.post(
    "/rentals/return",
    payload
  );
  return resp.data;
}

/**
 * ✅ Return rental items AND print Hindi receipt PDF
 */
export async function returnRentalAndPrint(payload, username) {
  const resp = await axiosClient.post(
    `/rentals/return-and-print?username=${encodeURIComponent(username)}`,
    payload,
    {
      responseType: "blob"   // 🔥 PDF blob
    }
  );
  return resp.data;
}