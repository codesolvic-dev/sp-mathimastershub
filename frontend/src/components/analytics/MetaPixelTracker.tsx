import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getPixelTracking } from "@/api/pixel.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { loadMetaPixel, metaPixel, setMetaPixelEventsConfig } from "@/utils/metaPixel";
import type { MetaPixelEvents } from "@/utils/metaPixelEvents";

function isStorefrontPath(pathname: string): boolean {
  return (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/developer") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/access")
  );
}

function readCachedPixel(): {
  enabled: boolean;
  pixelId: string;
  events?: Partial<MetaPixelEvents>;
} | null {
  const company = getCachedData<{
    metaPixel?: { enabled?: boolean; pixelId?: string; events?: MetaPixelEvents };
  }>(CACHE_KEYS.COMPANY);
  const pixelId = String(company?.metaPixel?.pixelId || "").replace(/\D/g, "");
  const enabled = Boolean(company?.metaPixel?.enabled) && Boolean(pixelId);
  if (!enabled) return null;
  return { enabled: true, pixelId, events: company?.metaPixel?.events };
}

/**
 * Loads Meta Pixel from GET /api/pixel/tracking (cache fallback) and fires PageView.
 */
export default function MetaPixelTracker() {
  const { pathname, search } = useLocation();
  const readyRef = useRef(false);
  const lastPathRef = useRef("");

  const activate = (pixelId: string, events?: Partial<MetaPixelEvents> | null) => {
    setMetaPixelEventsConfig(events);
    if (!loadMetaPixel(pixelId)) return false;
    readyRef.current = true;
    if (isStorefrontPath(pathname)) {
      metaPixel.pageView();
      lastPathRef.current = `${pathname}${search}`;
    }
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedPixel();
    if (cached) activate(cached.pixelId, cached.events);

    (async () => {
      try {
        const cfg = await getPixelTracking();
        if (cancelled) return;
        if (!cfg.enabled || !cfg.pixelId) return;
        activate(cfg.pixelId, cfg.events);
      } catch {
        /* pixel optional */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    if (!readyRef.current || !isStorefrontPath(pathname)) return;
    const key = `${pathname}${search}`;
    if (lastPathRef.current === key) return;
    lastPathRef.current = key;
    metaPixel.pageView();
  }, [pathname, search]);

  return null;
}
