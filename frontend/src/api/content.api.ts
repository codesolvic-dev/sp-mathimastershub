import API from "./axios";

/** Policy / content type key (e.g. privacy, warranty). */
export type ContentType = string;

export interface FAQ {
  question: string;
  answer: string;
}

export interface ContentPage {
  _id?: string;
  type: ContentType;
  kind?: "policy" | "faqs";
  label?: string;
  storePath?: string;
  enabled?: boolean;
  isSystem?: boolean;
  order?: number;
  title: string;
  subTitle: string;
  description: string;
  faqs?: FAQ[];
  lastUpdated?: string;
}

export type PolicyPage = ContentPage;

/** Public: enabled policies only. Admin: omit enabledOnly to get all. */
export const getPolicies = async (enabledOnly = false): Promise<PolicyPage[]> => {
  const res = await API.get("/content/policies", {
    params: enabledOnly ? { enabled: "true" } : undefined,
  });
  return res.data.data;
};

export const createPolicy = async (data: {
  label: string;
  type?: string;
  storePath?: string;
  enabled?: boolean;
}): Promise<PolicyPage> => {
  const res = await API.post("/content/policies", data);
  return res.data.data;
};

export const setPolicyEnabled = async (
  type: string,
  enabled: boolean
): Promise<PolicyPage> => {
  const res = await API.patch(`/content/policies/${type}/enabled`, { enabled });
  return res.data.data;
};

export const deletePolicy = async (type: string): Promise<void> => {
  await API.delete(`/content/policies/${type}`);
};

// Public: Get content by type
export const getContentByType = async (type: ContentType): Promise<ContentPage> => {
  const res = await API.get(`/content/${type}`);
  return res.data.data;
};

// Admin: Get all content pages
export const getAllContent = async (): Promise<ContentPage[]> => {
  const res = await API.get("/content");
  return res.data.data;
};

// Admin: Update content page
export const updateContent = async (
  type: ContentType,
  data: {
    title: string;
    subTitle: string;
    description: string;
    faqs?: FAQ[];
    enabled?: boolean;
    label?: string;
    storePath?: string;
  }
): Promise<ContentPage> => {
  const res = await API.put(`/content/${type}`, data);
  return res.data.data;
};
