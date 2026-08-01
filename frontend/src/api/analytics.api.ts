import API from "./axios";

export const incrementWebsiteVisit = async (): Promise<number | null> => {
  try {
    const res = await API.post("/analytics/visit");
    return res.data?.data?.websiteVisitors ?? null;
  } catch {
    return null;
  }
};
