import axiosClient from "./axiosClient";

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