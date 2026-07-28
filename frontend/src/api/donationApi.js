import axiosClient from "./axiosClient";

// GET donation form metadata
export async function getDonationFormMetadata() {
  const resp = await axiosClient.get("/donation/form-metadata");
  return resp.data;
}

// POST donation
export async function createDonation(payload, username) {
  const resp = await axiosClient.post(
    `/donation?username=${encodeURIComponent(username)}`,
    payload
  );
  return resp.data;
}

// ✅ NEW: Save & Print donation
export async function createDonationAndPrint(payload, username, language = "hi") {
  const resp = await axiosClient.post(
    `/donation/create-and-print?username=${encodeURIComponent(username)}&language=${encodeURIComponent(language)}`,
    payload,
    {
      responseType: "blob"   // 🔥 VERY IMPORTANT
    }
  );

  return resp.data; // this will be Blob
}

// SEARCH DONATIONS (existing backend API)
export const searchDonations = (payload) => {
  return axiosClient.post("/donation/search", payload);
};

// REPRINT RECEIPT
export const printDonation = (id, language = "hi") => {
  return axiosClient.get(`/donation/${id}/print`, {
    params: { language },
    responseType: "blob",
  });
};

// DISABLE (SOFT DELETE)
export const changeDonationStatus = (id, active, username) => {
  return axiosClient.put(`/donation/${id}/status`, null, {
    params: { active, username },
  });
};