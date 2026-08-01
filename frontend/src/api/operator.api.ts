import API from "./axios";

export const getOperatorUsers = async (role?: string) => {
  const res = await API.get("/operators", {
    params: role ? { role } : undefined,
  });
  return res.data.data;
};

export const createAdminUser = async (payload: {
  name: string;
  email: string;
  password: string;
  status?: "active" | "inactive";
  adminTabAccess?: string[];
}) => {
  const res = await API.post("/operators", payload);
  return res.data.data;
};

export const getOperatorUserById = async (id: string) => {
  const res = await API.get(`/operators/${id}`);
  return res.data.data;
};

export const updateOperatorUser = async (id: string, payload: any) => {
  const res = await API.put(`/operators/${id}`, payload);
  return res.data.data;
};

export const updateOperatorPassword = async (id: string, newPassword: string) => {
  const res = await API.put(`/operators/${id}/password`, { newPassword });
  return res.data;
};

export const deleteOperatorUser = async (id: string) => {
  const res = await API.delete(`/operators/${id}`);
  return res.data;
};
