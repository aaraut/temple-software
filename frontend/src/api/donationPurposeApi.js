import axiosClient from "./axiosClient";

// GET
export async function listDonationPurposes() {
  const resp = await axiosClient.get("/donation-purpose");
  return resp.data;
}

// CREATE
export async function createDonationPurpose(data, username) {
  const resp = await axiosClient.post(
    `/donation-purpose?username=${encodeURIComponent(username)}`,
    null,
    { params: data }
  );
  return resp.data;
}

// UPDATE
export async function updateDonationPurpose(id, data, username) {
  const resp = await axiosClient.put(
    `/donation-purpose/${id}?username=${encodeURIComponent(username)}`,
    null,
    { params: data }
  );
  return resp.data;
}