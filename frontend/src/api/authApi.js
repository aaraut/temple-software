import axiosClient from "./axiosClient";

/* ===========================
   LOGIN
=========================== */
export const loginApi = async (username, password) => {
  const res = await axiosClient.post("/auth/login", {
    username,
    password,
  });
  return res.data;
};

/* ===========================
   CHANGE PASSWORD
=========================== */
export const changePasswordApi = async (oldPassword, newPassword) => {
  const res = await axiosClient.post("/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return res.data;
};

/* ===========================
   FORGOT PASSWORD
=========================== */
export const forgotPasswordApi = async (payload) => {
  const res = await axiosClient.post("/auth/forgot-password", payload);
  return res.data;
};