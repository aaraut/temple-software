import axiosClient from "./axiosClient";

export async function listModuleAccess() {
  const resp = await axiosClient.get("/admin/module-access");
  return resp.data;
}

export async function updateModuleAccess(id, enabledForAdmin, enabledForUser) {
  const resp = await axiosClient.put(`/admin/module-access/${id}`, {
    enabledForAdmin,
    enabledForUser,
  });
  return resp.data;
}
