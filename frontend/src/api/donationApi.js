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