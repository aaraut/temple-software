import axios from "axios";

const API_BASE = "http://localhost:8080/api";

export const loginApi = async (username, password) => {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    username,
    password,
  });
  return res.data;
};

export const changePasswordApi = async (oldPassword, newPassword, token) => {
  await axios.post(
    `${API_BASE}/auth/change-password`,
    { oldPassword, newPassword },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const forgotPasswordApi = async (payload) => {
  await axios.post(`${API_BASE}/auth/forgot-password`, payload);
};
