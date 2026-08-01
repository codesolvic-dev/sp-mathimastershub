import API from "./axios";

let catalogTypesInflight: Promise<any> | null = null;
let enabledCatalogTypesInflight: Promise<any> | null = null;

export const getCatalogTypes = async () => {
  if (catalogTypesInflight) return catalogTypesInflight;
  catalogTypesInflight = API.get("/catalogtypes")
    .then((res) => res.data.data)
    .finally(() => {
      catalogTypesInflight = null;
    });
  return catalogTypesInflight;
};

export const getEnabledCatalogTypes = async () => {
  if (enabledCatalogTypesInflight) return enabledCatalogTypesInflight;
  enabledCatalogTypesInflight = API.get("/catalogtypes/enabled")
    .then((res) => res.data.data)
    .finally(() => {
      enabledCatalogTypesInflight = null;
    });
  return enabledCatalogTypesInflight;
};

export const createCatalogType = async (data: {
  slug: string;
  label: string;
  showInAdmin?: boolean;
  order?: number;
}) => {
  const res = await API.post("/catalogtypes", data);
  return res.data.data;
};

export const updateCatalogType = async (
  id: string,
  data: Partial<{ slug: string; label: string; showInAdmin: boolean; order: number }>
) => {
  const res = await API.put(`/catalogtypes/${id}`, data);
  return res.data.data;
};

export const deleteCatalogType = async (id: string) => {
  const res = await API.delete(`/catalogtypes/${id}`);
  return res.data;
};
