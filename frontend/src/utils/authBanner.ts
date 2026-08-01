import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";

const DEFAULT_LOGIN_BANNER = "/download.jpeg";

/** In-memory URL so login ↔ signup navigation does not flash the default image. */
let memoryLoginBannerUrl: string | null = null;

export function getLoginBannerUrl(): string {
  if (memoryLoginBannerUrl) return memoryLoginBannerUrl;
  const cached = getCachedData<string>(CACHE_KEYS.LOGIN_BANNER);
  if (cached) {
    memoryLoginBannerUrl = cached;
    return cached;
  }
  return DEFAULT_LOGIN_BANNER;
}

export function setLoginBannerUrl(url: string) {
  memoryLoginBannerUrl = url;
  setCachedData(CACHE_KEYS.LOGIN_BANNER, url);
}

export function clearLoginBannerUrl() {
  memoryLoginBannerUrl = null;
}

/** Preload image; resolves when ready or on error (never hangs). */
export function preloadLoginBanner(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url || url === DEFAULT_LOGIN_BANNER) {
      resolve();
      return;
    }
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
