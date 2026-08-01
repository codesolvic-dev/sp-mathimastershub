import { useEffect, useState } from "react";
import { getEnabledLandingSections } from "@/api/landingsection.api";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { getCachedData, setCachedData } from "@/utils/cache";

const CACHE = getLandingCacheKeys("tertiary-product");

/** Enabled widget sectionIds for Sp eCom product detail page (ordered). */
export function useEcomProductDetailSections(): string[] {
  const [sectionIds, setSectionIds] = useState<string[]>(() => {
    const cached = getCachedData<string[]>(CACHE.ENABLED);
    return Array.isArray(cached) ? cached : [];
  });

  useEffect(() => {
    const cached = getCachedData<string[]>(CACHE.ENABLED);
    if (Array.isArray(cached)) {
      setSectionIds(cached);
    }

    getEnabledLandingSections("tertiary-product")
      .then((ids) => {
        if (Array.isArray(ids)) {
          setSectionIds(ids);
          setCachedData(CACHE.ENABLED, ids);
        }
      })
      .catch(() => {});
  }, []);

  return sectionIds;
}
