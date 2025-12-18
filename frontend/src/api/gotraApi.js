import axiosClient from "./axiosClient";

// GET /api/gotras
export async function listGotras() {
  const resp = await axiosClient.get("/gotras");
  return resp.data;
}

// GET /api/gotras/{id}
export async function getGotra(id) {
  const resp = await axiosClient.get(`/gotras/${id}`);
  return resp.data;
}

// POST /api/gotras
// payload = { gotraNameHi, gotraNameEn }
export async function createGotra(payload) {
  const resp = await axiosClient.post("/gotras", payload);
  return resp.data;
}

// PUT /api/gotras/{id}
export async function updateGotra(id, payload) {
  const resp = await axiosClient.put(`/gotras/${id}`, payload);
  return resp.data;
}

// DELETE /api/gotras/{id}
export async function deleteGotra(id) {
  const resp = await axiosClient.delete(`/gotras/${id}`);
  return resp.data;
}
