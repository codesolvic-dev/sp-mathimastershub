import API from "./axios";

export type CategoryStatus = "active" | "inactive";

type GetCategoriesOptions = {
  activeOnly?: boolean;
};

export const getCategories = async (options?: GetCategoriesOptions) => {
  const res = await API.get("/categories", {
    params: options?.activeOnly ? { activeOnly: true } : undefined,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

export const addCategory = async (category: any) => {
  const formData = new FormData();
  formData.append("name", category.name);
  formData.append("status", category.status || "active");

  if (category.iconFile) {
    formData.append("icon", category.iconFile);
  }

  const res = await API.post("/categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};

export const updateCategory = async (id: string, category: any) => {
  const formData = new FormData();
  formData.append("name", category.name);
  if (category.status) {
    formData.append("status", category.status);
  }

  if (category.iconFile) {
    formData.append("icon", category.iconFile);
  }

  const res = await API.put(`/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};

export const updateCategoryStatus = async (id: string, status: CategoryStatus) => {
  const res = await API.patch(`/categories/${id}/status`, { status });
  return res.data.data;
};

export const deleteCategory = async (id: string | number) => {
  const res = await API.delete(`/categories/${id}`);
  return res.data.success;
};

export const reorderCategories = async (orderedIds: string[]) => {
  const res = await API.patch("/categories/reorder", { orderedIds });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};
