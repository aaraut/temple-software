// src/api/gotraApi.js
import axios from "axios";

const base = "http://localhost:8080/api/gotras";

export async function listGotras() {
  const resp = await axios.get(base);
  return resp.data;
}

export async function getGotra(id) {
  const resp = await axios.get(`${base}/${id}`);
  return resp.data;
}

export async function createGotra(payload, operatorId = "system") {
  const headers = { "X-Operator-Id": operatorId };
  const resp = await axios.post(base, payload, { headers });
  return resp.data;
}

export async function updateGotra(id, payload) {
  const resp = await axios.put(`${base}/${id}`, payload);
  return resp.data;
}

export async function deleteGotra(id) {
  const resp = await axios.delete(`${base}/${id}`);
  return resp.data;
}
