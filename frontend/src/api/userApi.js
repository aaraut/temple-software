import axiosClient from "./axiosClient";

export async function listUsers() {
  const resp = await axiosClient.get("/admin/users");
  return resp.data;
}

export async function createUser(payload) {
  const resp = await axiosClient.post("/admin/users", payload);
  return resp.data;
}

export async function updateUser(id, payload) {
  const resp = await axiosClient.put(`/admin/users/${id}`, payload);
  return resp.data;
}

export async function resetUserPassword(id, tempPassword) {
  const resp = await axiosClient.post(
    `/admin/users/${id}/reset-password?tempPassword=${encodeURIComponent(tempPassword)}`
  );
  return resp.data;
}

export async function unlockUser(id) {
  const resp = await axiosClient.patch(`/admin/users/${id}/unlock`);
  return resp.data;
}

