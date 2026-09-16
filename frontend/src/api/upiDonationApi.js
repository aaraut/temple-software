import axiosClient from "./axiosClient";

// Save & Print UPI donation bill
export async function createUpiDonationAndPrint(payload, username, language = "hi") {
  const resp = await axiosClient.post(
    `/upi-donation/create-and-print?username=${encodeURIComponent(username)}&language=${encodeURIComponent(language)}`,
    payload,
    { responseType: "blob" }
  );
  return resp.data; // Blob
}

// SEARCH UPI donation bills
export const searchUpiDonations = (payload) => {
  return axiosClient.post("/upi-donation/search", payload);
};

// REPRINT
export const printUpiDonation = (id, language = "hi") => {
  return axiosClient.get(`/upi-donation/${id}/print`, {
    params: { language },
    responseType: "blob",
  });
};
