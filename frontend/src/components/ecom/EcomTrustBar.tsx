import React, { useEffect, useMemo, useState } from "react";
import { getLandingSections } from "@/api/landingsection.api";
import { ECOM_SECTION_INNER } from "@/landings/tertiary/constants";
import {
  ECOM_TRUST_BAR_SECTION_ID,
  parseEcomTrustBarItems,
} from "@/landings/tertiary/ecomTrustBar";
import type { LandingSectionPage } from "@/landings/types";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { buildSectionContentMapFromList } from "@/utils/landingSectionContent";
import { getCachedData } from "@/utils/cache";

type EcomTrustBarProps = {
  /** When provided (e.g. home page), skips API fetch */
  contentMap?: Record<string, Record<string, string>>;
  /** Landing section page for contentJson lookup */
  contentPage?: LandingSectionPage;
  className?: string;
  /** Wrap in `<section id="ecom-trust-bar">` for landing page */
  asSection?: boolean;
};

export default function EcomTrustBar({
  contentMap,
  contentPage = "tertiary",
  className = "",
  asSection = false,
}: EcomTrustBarProps) {
  const landingCache = getLandingCacheKeys(contentPage);
  const [resolvedContentMap, setResolvedContentMap] = useState<
    Record<string, Record<string, string>> | undefined
  >(contentMap);

  useEffect(() => {
    if (contentMap) {
      setResolvedContentMap(contentMap);
      return;
    }

    const cached = getCachedData<{
      contentMap?: Record<string, Record<string, string>>;
    }>(landingCache.SECTIONS);
    if (cached?.contentMap && Object.keys(cached.contentMap).length > 0) {
      setResolvedContentMap(cached.contentMap);
    }

    getLandingSections(contentPage)
      .then((list) => {
        const map = buildSectionContentMapFromList(list || []);
        if (Object.keys(map).length > 0) setResolvedContentMap(map);
      })
      .catch(() => {});
  }, [contentMap, contentPage]);

  const items = useMemo(() => parseEcomTrustBarItems(resolvedContentMap), [resolvedContentMap]);

  const grid = (
    <div
      className={`${ECOM_SECTION_INNER} grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4${asSection ? "" : ` ${className}`}`}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={`${item.label}-${index}`}
            className="flex items-center gap-3 sm:gap-4 rounded-md bg-[#e9eef5] px-4 py-4 sm:px-5 sm:py-5 min-h-[4.5rem]"
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-[#1a3d6b]" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-medium text-[#1a3d6b] leading-snug">{item.label}</p>
              {item.description ? (
                <p className="text-xs sm:text-sm text-[#1a3d6b]/75 mt-0.5 leading-snug">{item.description}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (asSection) {
    return (
      <section id={ECOM_TRUST_BAR_SECTION_ID} className={`w-full max-w-none py-6 sm:py-8 ${className}`}>
        {grid}
      </section>
    );
  }

  return grid;
}
