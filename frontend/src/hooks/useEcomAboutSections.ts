import { useEffect, useState } from "react";
import {
  getLandingSections,
  type LandingSectionItem,
} from "@/api/landingsection.api";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { buildSectionContentMapFromList } from "@/utils/landingSectionContent";
import { getCachedData, setCachedData } from "@/utils/cache";
import { isCatalogStyleLandingSectionId } from "@/utils/landingSectionCatalog";

const CACHE = getLandingCacheKeys("tertiary-about");

export type AboutPageCache = {
  sectionIds: string[];
  codeMap: Record<string, string>;
  labelMap: Record<string, string>;
  contentMap: Record<string, Record<string, string>>;
};

function parseAboutSectionData(list: LandingSectionItem[]) {
  const labelMap: Record<string, string> = {};
  const codeMap: Record<string, string> = {};
  for (const section of list) {
    if (section.sectionId && section.label) {
      labelMap[section.sectionId] = section.label;
    }
    const raw = typeof section.code === "string" ? section.code : "";
    if (!section.sectionId || !raw.trim()) continue;
    if (isCatalogStyleLandingSectionId(section.sectionId)) continue;
    codeMap[section.sectionId] = raw;
  }
  return { labelMap, codeMap };
}

function enabledSectionIdsFromList(list: LandingSectionItem[]): string[] {
  return [...list]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.sectionId);
}

function applyList(list: LandingSectionItem[]): AboutPageCache {
  const ordered = enabledSectionIdsFromList(list);
  const { labelMap, codeMap } = parseAboutSectionData(list);
  const contentMap = buildSectionContentMapFromList(list);
  return { sectionIds: ordered, codeMap, labelMap, contentMap };
}

function readCache(): AboutPageCache | null {
  const cached = getCachedData<AboutPageCache>(CACHE.SECTIONS);
  if (cached?.sectionIds?.length && cached.contentMap) return cached;
  return null;
}

/**
 * About Us page data — cache-first (instant paint), one network fetch, background refresh.
 * Avoids hardcoded defaults until we have real (or cached builder) data.
 */
export function useEcomAboutSections() {
  const cached = readCache();
  const [sectionIds, setSectionIds] = useState<string[]>(() => cached?.sectionIds ?? []);
  const [customCodeMap, setCustomCodeMap] = useState<Record<string, string>>(
    () => cached?.codeMap ?? {}
  );
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>(
    () => cached?.labelMap ?? {}
  );
  const [contentMap, setContentMap] = useState<Record<string, Record<string, string>>>(
    () => cached?.contentMap ?? {}
  );
  const [ready, setReady] = useState(() => Boolean(cached));

  useEffect(() => {
    let cancelled = false;

    getLandingSections("tertiary-about")
      .then((list) => {
        if (cancelled) return;
        const next = applyList(Array.isArray(list) ? list : []);
        setSectionIds(next.sectionIds);
        setCustomCodeMap(next.codeMap);
        setSectionLabels(next.labelMap);
        setContentMap(next.contentMap);
        setCachedData(CACHE.ENABLED, next.sectionIds);
        setCachedData(CACHE.SECTIONS, next);
        setCachedData(CACHE.FULL, Array.isArray(list) ? list : []);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = readCache();
        if (fallback) {
          setSectionIds(fallback.sectionIds);
          setCustomCodeMap(fallback.codeMap);
          setSectionLabels(fallback.labelMap);
          setContentMap(fallback.contentMap);
        } else {
          setSectionIds([]);
          setContentMap({});
        }
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    sectionIds,
    customCodeMap,
    sectionLabels,
    contentMap,
    ready,
  };
}
