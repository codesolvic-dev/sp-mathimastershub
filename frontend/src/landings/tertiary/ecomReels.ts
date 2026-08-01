import {
  contentOverride,
  isContentFlagEnabled,
  parseCategorySelectionCsv,
} from "@/utils/landingSectionContent";

export const ECOM_REELS_SECTION_ID = "ecom-reels";

export type EcomReelsSettings = {
  title: string;
  /** Comma-separated product IDs (order preserved) */
  productIds: string[];
  showArrows: boolean;
  /** Prefer video1; fall back to video2 */
  preferVideo2: boolean;
};

const DEFAULTS: EcomReelsSettings = {
  title: "",
  productIds: [],
  showArrows: true,
  preferVideo2: false,
};

export function parseEcomReelsSettings(
  contentMap?: Record<string, Record<string, string>>,
  sectionId: string = ECOM_REELS_SECTION_ID
): EcomReelsSettings {
  const map = contentMap ?? {};
  return {
    title: contentOverride(map, sectionId, "title", DEFAULTS.title).trim(),
    productIds: parseCategorySelectionCsv(
      contentOverride(map, sectionId, "products", "")
    ),
    showArrows: isContentFlagEnabled(
      contentOverride(map, sectionId, "showArrows", "yes"),
      true
    ),
    preferVideo2: isContentFlagEnabled(
      contentOverride(map, sectionId, "preferVideo2", "no"),
      false
    ),
  };
}
