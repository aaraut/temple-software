import axiosClient from "./axiosClient";

export const getRooms = async () => {
  const response = await axiosClient.get("/rooms");
  return response.data;
};

export const createRoom = async (data) => {
  const response = await axiosClient.post("/rooms", data);
  return response.data;
};

export const updateRoom = async (id, data) => {
  const response = await axiosClient.put(`/rooms/${id}`, data);
  return response.data;
};

export const updateCleaningStatus = async (id, data) => {
  const response = await axiosClient.patch(
    `/rooms/${id}/cleaning-status`,
    data
  );
  return response.data;
};

export const getRoomCategories = async () => {
  const response = await axiosClient.get("/room-categories");
  return response.data;
};

export const createRoomCategory = async (data) => {
  const response = await axiosClient.post("/room-categories", data);
  return response.data;
};

export const updateRoomCategory = async (id, data) => {
  const response = await axiosClient.put(`/room-categories/${id}`, data);
  return response.data;
};

export const getBhaktniwasBlocks = async () => {
  const response = await axiosClient.get("/bhaktniwas/blocks");
  return response.data;
};

export const getDailySheet = async (blockId, date) => {
  const response = await axiosClient.get(
    `/bhaktniwas/${blockId}/daily-sheet`,
    { params: { date } }
  );
  return response.data;
};

export const getAmenities = async () => {
  const response = await axiosClient.get("/amenities");
  return response.data;
};

export const deleteRoom = async (id, username) => {
  const response = await axiosClient.delete(
    `/rooms/${id}?deletedBy=${username}`
  );
  return response.data;
};

/* ---------- BLOCK ROOMS ---------- */
export const blockRooms = (data) =>
  axiosClient.post("/rooms/block", data);

/* ---------- UNBLOCK ROOMS ---------- */
export const unblockRooms = (data) =>
  axiosClient.post("/rooms/unblock", data);

/* ---------- GET ACTIVE BLOCKS FOR MONTH ---------- */
export const getBlocksForMonth = (month) =>
  axiosClient.get(`/rooms/blocks?month=${month}`);
