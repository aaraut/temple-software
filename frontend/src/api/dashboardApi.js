import axiosClient from "./axiosClient";

export const getDashboardSummary = (
  period,
  selectedUser,
  loggedInUser,
  role
) => {
  return axiosClient.get("/dashboard/summary", {
    params: {
      period,
      selectedUser,
      loggedInUser,
      role,
    },
  });
};