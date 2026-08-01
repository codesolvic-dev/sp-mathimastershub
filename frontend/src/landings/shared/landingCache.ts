import { CACHE_KEYS } from "@/utils/cache";
import type { LandingSectionPage } from "@/landings/types";

export function getLandingCacheKeys(page: LandingSectionPage) {
  if (page === "tertiary") {
    return {
      ENABLED: "enabled_landing_sections_tertiary",
      SECTIONS: "landing_sections_tertiary",
      FULL: "landing_sections_full_tertiary",
    };
  }
  if (page === "tertiary-product") {
    return {
      ENABLED: "enabled_landing_sections_tertiary_product",
      SECTIONS: "landing_sections_tertiary_product",
      FULL: "landing_sections_full_tertiary_product",
    };
  }
  if (page === "tertiary-about") {
    return {
      ENABLED: "enabled_landing_sections_tertiary_about",
      SECTIONS: "landing_sections_tertiary_about",
      FULL: "landing_sections_full_tertiary_about",
    };
  }
  return {
    ENABLED: CACHE_KEYS.ENABLED_LANDING_SECTIONS,
    SECTIONS: CACHE_KEYS.LANDING_SECTIONS,
    FULL: CACHE_KEYS.LANDING_SECTIONS_FULL,
  };
}
