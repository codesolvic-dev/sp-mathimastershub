import { useEffect, useState } from "react";
import { getLandingSections } from "@/api/landingsection.api";
import type { LandingSectionPage } from "@/landings/types";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { buildSectionContentMapFromList } from "@/utils/landingSectionContent";
import { getCachedData, setCachedData } from "@/utils/cache";

type SectionsCacheBlob = {
  contentMap?: Record<string, Record<string, string>>;
  [key: string]: unknown;
};

/** Editable section copy from Sp eCom Builder (`contentJson` per section). */
export function useLandingSectionContentMap(page: LandingSectionPage): {
  contentMap: Record<string, Record<string, string>>;
  ready: boolean;
} {
  const landingCache = getLandingCacheKeys(page);
  const [contentMap, setContentMap] = useState<Record<string, Record<string, string>>>(() => {
    const cached = getCachedData<SectionsCacheBlob>(landingCache.SECTIONS);
    return cached?.contentMap ?? {};
  });
  const [ready, setReady] = useState(() => {
    const cached = getCachedData<SectionsCacheBlob>(landingCache.SECTIONS);
    return cached?.contentMap != null;
  });

  useEffect(() => {
    let cancelled = false;

    getLandingSections(page)
      .then((list) => {
        if (cancelled) return;
        const next = buildSectionContentMapFromList(Array.isArray(list) ? list : []);
        setContentMap(next);
        const existing = getCachedData<SectionsCacheBlob>(landingCache.SECTIONS) ?? {};
        setCachedData(landingCache.SECTIONS, { ...existing, contentMap: next });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [page, landingCache.SECTIONS]);

  return { contentMap, ready };
}
