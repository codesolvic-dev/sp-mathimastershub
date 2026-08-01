import API from "./axios";

// Derive API base URL from VITE_API_URLS (same as axios) so one env var works in Vercel
const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((u: string) => u.trim()).filter(Boolean);
const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const apiUrl = urls.length ? (isLocalhost ? urls[0] : (urls[1] || urls[0])) : (import.meta.env.VITE_API_URL || "");
const BASE_URL = apiUrl ? String(apiUrl).replace("/api", "") : "";

export type BannerSlot =
  | "hero-main" // big hero banner for Landing page
  | "hero-secondary" // second banner on Landing page
  | "hero-tertiary" // third banner on Landing page
  | "hero-last" // last banner on Landing page (above feedback section)
  | "shop-main" // banner at the top of Shop page
  | "about-us" // hero image on About Us page
  | "login" // full-page background on Login / Sign up / Forgot password
  | "brand-promo-1" // Brand Promotional section 1 media
  | "brand-promo-2"; // Brand Promotional section 2 media

export interface Banner {
  _id: string;
  slot: BannerSlot | string;
  imageUrl: string;
  targetUrl: string;
  updatedAt?: string;
}

const mapImage = (b: any): Banner => {
  const getFull = (img: string | null) => {
    if (!img || img.trim() === "") return "";
    if (img.startsWith("http")) return img;
    return `${BASE_URL}${img}`;
  };

  return {
    _id: b._id,
    slot: b.slot,
    imageUrl: getFull(b.imageUrl),
    targetUrl: b.targetUrl || "",
    updatedAt: b.updatedAt,
  };
};

export const SHOP_MAIN_BANNER_ASPECT = 1080 / 280;
/** Landing eCom hero slides (hero-main / secondary / tertiary) */
export const HERO_BANNER_ASPECT = 1080 / 360;

export const BANNER_SLOT_SIZES: Record<string, string> = {
  "hero-main": "1080×360 (Landing hero)",
  "hero-secondary": "1080×360 (Landing secondary)",
  "hero-tertiary": "1080×360 (Landing tertiary)",
  "hero-last": "1920×1080, 16:9 (Landing last banner)",
  "shop-main": "1080×280 (Shop page banner)",
  "about-us": "1200×900, 4:3 (About Us page image)",
  login: "1920×1080, 16:9 (Login / Sign up background)",
  "brand-promo-1": "16:9 media (image/video poster)",
  "brand-promo-2": "16:9 media (image/video poster)",
};

// -------- PUBLIC: Get all banners (used on Landing / Shop pages) --------
export const getBanners = async (): Promise<Banner[]> => {
  const res = await API.get("/banners");
  return (res.data.data || []).map(mapImage);
};

// -------- ADMIN: Update one banner slot --------
export const updateBanner = async (
  slot: BannerSlot | string,
  options: { targetUrl: string; file?: File | null; clearImage?: boolean }
): Promise<Banner> => {
  const form = new FormData();
  form.append("targetUrl", options.targetUrl || "");
  if (options.file) {
    form.append("image", options.file);
  }
  if (options.clearImage) {
    form.append("clearImage", "true");
  }

  const res = await API.put(`/banners/${slot}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return mapImage(res.data.data);
};


















