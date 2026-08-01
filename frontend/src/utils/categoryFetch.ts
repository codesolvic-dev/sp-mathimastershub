import { getCategories } from "@/api/category.api";
import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";
import { resolveCompanyAssetUrl } from "@/utils/companyBrand";

export type CategoryRecord = {
  _id: string;
  name: string;
  icon?: string;
  status?: string;
  [key: string]: unknown;
};

let inflight: Promise<CategoryRecord[]> | null = null;

export function resolveCategoryImageUrl(src?: string): string {
  const raw = String(src || "").trim();
  if (!raw) return "";
  // Placeholder defaults — treat as empty so UI can show letter fallback
  if (raw === "/default-category.png" || raw === "/category.png") return "";
  return resolveCompanyAssetUrl(raw) || raw;
}

/** Warm browser cache for category hero / nav icons. */
export function preloadCategoryImages(categories: CategoryRecord[], limit = 8) {
  if (typeof window === "undefined" || !Array.isArray(categories)) return;
  const urls = categories
    .slice(0, limit)
    .map((c) => resolveCategoryImageUrl(c.icon))
    .filter(Boolean);
  for (const url of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

/** Single shared getCategories(activeOnly) — navbar + Category Hero share one request. */
export async function fetchCategoriesShared(options?: {
  preferCache?: boolean;
  preloadImages?: boolean;
}): Promise<CategoryRecord[]> {
  if (options?.preferCache) {
    const cached = getCachedData<CategoryRecord[]>(CACHE_KEYS.CATEGORIES);
    if (Array.isArray(cached) && cached.length > 0) {
      if (options.preloadImages !== false) preloadCategoryImages(cached);
      return cached;
    }
  }

  if (inflight) return inflight;

  inflight = getCategories({ activeOnly: true })
    .then((list) => {
      const next = (Array.isArray(list) ? list : []) as CategoryRecord[];
      if (next.length > 0) setCachedData(CACHE_KEYS.CATEGORIES, next);
      if (options?.preloadImages !== false) preloadCategoryImages(next);
      return next;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
