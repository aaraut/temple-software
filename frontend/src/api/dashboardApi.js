import axiosClient from "./axiosClient";

export const getDashboardSummary = (
  period,
  selectedUser,
  loggedInUser,
  role,
  date        // optional: "yyyy-mm-dd", if omitted backend uses today
) => {
  const params = { period, selectedUser, loggedInUser, role };
  if (date) params.date = date;
  return axiosClient.get("/dashboard/summary", { params });
};
