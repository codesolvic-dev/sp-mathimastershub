import API from "./axios";
import type { LandingSectionPage } from "@/landings/types";

export interface LandingSectionItem {
  _id: string;
  sectionId: string;
  page?: LandingSectionPage;
  label: string;
  enabled: boolean;
  order: number;
  isCustom?: boolean;
  code?: string;
  contentJson?: string;
  showInNavbarDropdown?: boolean;
  /** Built-in template id when this row is a duplicate */
  baseSectionId?: string;
}

/** Dedupe concurrent GETs for the same page (About + content map, home prefetch, etc.). */
const landingSectionsInflight = new Map<string, Promise<LandingSectionItem[]>>();

export const getLandingSections = async (
  page: LandingSectionPage = "secondary"
): Promise<LandingSectionItem[]> => {
  const key = page;
  const existing = landingSectionsInflight.get(key);
  if (existing) return existing;

  const req = API.get("/landingsections", { params: { page } })
    .then((res) => res.data.data as LandingSectionItem[])
    .finally(() => {
      landingSectionsInflight.delete(key);
    });

  landingSectionsInflight.set(key, req);
  return req;
};

export const getEnabledLandingSections = async (
  page: LandingSectionPage = "secondary"
): Promise<string[]> => {
  const res = await API.get("/landingsections/enabled", { params: { page } });
  return res.data.data;
};

export const createLandingSection = async (
  label: string,
  page: LandingSectionPage = "secondary"
): Promise<LandingSectionItem> => {
  const res = await API.post("/landingsections", { label, page });
  return res.data.data;
};

export const duplicateLandingSection = async (
  id: string
): Promise<LandingSectionItem> => {
  const res = await API.post(`/landingsections/${id}/duplicate`);
  return res.data.data;
};

export const updateLandingSection = async (
  id: string,
  data: {
    enabled?: boolean;
    order?: number;
    code?: string;
    label?: string;
    contentJson?: string;
    showInNavbarDropdown?: boolean;
  }
): Promise<LandingSectionItem> => {
  const res = await API.put(`/landingsections/${id}`, data);
  return res.data.data;
};
