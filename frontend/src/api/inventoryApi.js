import axiosClient from "./axiosClient";

// GET /api/inventory/items?category=BARTAN
export async function getInventoryItems(category) {
  const resp = await axiosClient.get(
    `/inventory/items?category=${category}`
  );
  return resp.data;
}

// POST /api/inventory/item
export async function createInventoryItem(payload) {
  const resp = await axiosClient.post(
    "/inventory/item",
    payload
  );
  return resp.data;
}

// PUT /api/inventory/item/{id}
export async function updateInventoryItem(id, payload) {
  const resp = await axiosClient.put(
    `/inventory/item/${id}`,
    payload
  );
  return resp.data;
}
