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
