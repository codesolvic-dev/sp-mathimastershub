import {
  contentOverride,
  isContentFlagEnabled,
  parseCategorySelectionCsv,
} from "@/utils/landingSectionContent";

export const ECOM_CATEGORY_HERO_SECTION_ID = "ecom-category-hero";

export type EcomCategoryHeroSettings = {
  buttonLabel: string;
  /** Left large tile carousel — category IDs */
  mainCategoryIds: string[];
  /** Right stacked tiles — first 2 IDs used */
  sideCategoryIds: string[];
  /** Master switch: on = carousel; off = first category only (static) */
  sliderEnabled: boolean;
  showArrows: boolean;
  autoplay: boolean;
  /** Optional title overrides (empty = category name) */
  mainTitle: string;
  side1Title: string;
  side2Title: string;
  /** Optional image URL overrides (empty = category icon) */
  mainImageUrl: string;
  side1ImageUrl: string;
  side2ImageUrl: string;
};

const DEFAULTS: EcomCategoryHeroSettings = {
  buttonLabel: "View Items",
  mainCategoryIds: [],
  sideCategoryIds: [],
  sliderEnabled: true,
  showArrows: true,
  autoplay: true,
  mainTitle: "",
  side1Title: "",
  side2Title: "",
  mainImageUrl: "",
  side1ImageUrl: "",
  side2ImageUrl: "",
};

export function parseEcomCategoryHeroSettings(
  contentMap?: Record<string, Record<string, string>>,
  sectionId: string = ECOM_CATEGORY_HERO_SECTION_ID
): EcomCategoryHeroSettings {
  const map = contentMap ?? {};
  const sliderEnabled = isContentFlagEnabled(
    contentOverride(map, sectionId, "sliderEnabled", "yes"),
    true
  );
  return {
    buttonLabel: contentOverride(map, sectionId, "buttonLabel", DEFAULTS.buttonLabel),
    mainCategoryIds: parseCategorySelectionCsv(
      contentOverride(map, sectionId, "mainCategories", "")
    ),
    sideCategoryIds: parseCategorySelectionCsv(
      contentOverride(map, sectionId, "sideCategories", "")
    ),
    sliderEnabled,
    showArrows:
      sliderEnabled &&
      isContentFlagEnabled(contentOverride(map, sectionId, "showArrows", "yes"), true),
    autoplay:
      sliderEnabled &&
      isContentFlagEnabled(contentOverride(map, sectionId, "autoplay", "yes"), true),
    mainTitle: contentOverride(map, sectionId, "mainTitle", ""),
    side1Title: contentOverride(map, sectionId, "side1Title", ""),
    side2Title: contentOverride(map, sectionId, "side2Title", ""),
    mainImageUrl: contentOverride(map, sectionId, "mainImageUrl", "").trim(),
    side1ImageUrl: contentOverride(map, sectionId, "side1ImageUrl", "").trim(),
    side2ImageUrl: contentOverride(map, sectionId, "side2ImageUrl", "").trim(),
  };
}
