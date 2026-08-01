import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { loadMetaPixel, metaPixel, setMetaPixelEventsConfig } from "@/utils/metaPixel";
import { normalizeMetaPixelEvents } from "@/utils/metaPixelEvents";

/**
 * Boot Meta Pixel before React paint when possible.
 * Meta Pixel Helper often scans only on first load — late SPA injection looks like "No Pixels found".
 */
export function bootstrapMetaPixel(): void {
  if (typeof window === "undefined") return;

  try {
    const company = getCachedData<{
      metaPixel?: { enabled?: boolean; pixelId?: string; events?: Record<string, boolean> };
    }>(CACHE_KEYS.COMPANY);
    const cachedId = String(company?.metaPixel?.pixelId || "").replace(/\D/g, "");
    if (company?.metaPixel?.enabled && cachedId) {
      setMetaPixelEventsConfig(company.metaPixel.events);
      if (loadMetaPixel(cachedId)) metaPixel.pageView();
    }
  } catch {
    /* ignore */
  }

  const apiBase =
    import.meta.env.DEV &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? "/api"
      : String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "") || "/api";

  void fetch(`${apiBase}/pixel/tracking`, { credentials: "include" })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const data = json?.data;
      if (!data?.enabled || !data?.pixelId) return;
      setMetaPixelEventsConfig(normalizeMetaPixelEvents(data.events));
      if (loadMetaPixel(String(data.pixelId))) metaPixel.pageView();
    })
    .catch(() => {});
}
