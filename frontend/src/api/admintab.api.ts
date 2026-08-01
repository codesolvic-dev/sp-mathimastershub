import API from "./axios";

let adminTabsInflight: Promise<any> | null = null;
let enabledAdminTabsInflight: Promise<any> | null = null;

export const getAdminTabs = async () => {
  if (adminTabsInflight) return adminTabsInflight;
  adminTabsInflight = API.get("/admintabs")
    .then((res) => res.data.data)
    .finally(() => {
      adminTabsInflight = null;
    });
  return adminTabsInflight;
};

export const getEnabledAdminTabs = async () => {
  if (enabledAdminTabsInflight) return enabledAdminTabsInflight;
  enabledAdminTabsInflight = API.get("/admintabs/enabled")
    .then((res) => res.data.data)
    .finally(() => {
      enabledAdminTabsInflight = null;
    });
  return enabledAdminTabsInflight;
};

export const createAdminTab = async (tab: any) => {
  const res = await API.post("/admintabs", tab);
  return res.data.data;
};

export const updateAdminTab = async (id: string, tab: any) => {
  const res = await API.put(`/admintabs/${id}`, tab);
  return res.data.data;
};

export const deleteAdminTab = async (id: string) => {
  const res = await API.delete(`/admintabs/${id}`);
  return res.data;
};
