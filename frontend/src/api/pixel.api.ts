import API from "./axios";
import {
  normalizeMetaPixelEvents,
  type MetaPixelEvents,
} from "@/utils/metaPixelEvents";

export type PixelTrackingConfig = {
  enabled: boolean;
  pixelId: string;
  provider?: string;
  events: MetaPixelEvents;
};

export const getPixelTracking = async (): Promise<PixelTrackingConfig> => {
  const res = await API.get("/pixel/tracking");
  const data = res.data?.data || {};
  return {
    enabled: Boolean(data.enabled),
    pixelId: String(data.pixelId || "").trim(),
    provider: data.provider || "meta",
    events: normalizeMetaPixelEvents(data.events),
  };
};
