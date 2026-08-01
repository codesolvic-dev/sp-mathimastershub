import { contentOverride } from "@/utils/landingSectionContent";

export const ECOM_BRAND_PROMO_SECTION_ID = "ecom-brand-promo";
export const ECOM_BRAND_PROMO_2_SECTION_ID = "ecom-brand-promo-2";

export type EcomBrandPromoSettings = {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  videoUrl: string;
  /** fullBanner = edge-to-edge image; split = text + media columns */
  layout: "fullBanner" | "split";
};

const DEFAULTS: Record<string, EcomBrandPromoSettings> = {
  [ECOM_BRAND_PROMO_SECTION_ID]: {
    eyebrow: "Brand Promotional Title",
    title: "Elevate your everyday style",
    description:
      "Discover premium ready-to-wear pieces crafted for comfort and confidence. Shop the latest arrivals and exclusive offers.",
    buttonLabel: "View Products",
    buttonHref: "/shop",
    videoUrl: "",
    layout: "fullBanner",
  },
  [ECOM_BRAND_PROMO_2_SECTION_ID]: {
    eyebrow: "Brand Promotional Title",
    title: "Elevate your everyday style",
    description:
      "Discover premium ready-to-wear pieces crafted for comfort and confidence. Shop the latest arrivals and exclusive offers.",
    buttonLabel: "View Products",
    buttonHref: "/shop",
    videoUrl: "",
    layout: "fullBanner",
  },
};

export function parseEcomBrandPromoSettings(
  sectionId: string,
  contentMap?: Record<string, Record<string, string>>
): EcomBrandPromoSettings {
  const fallback = DEFAULTS[sectionId] ?? DEFAULTS[ECOM_BRAND_PROMO_SECTION_ID];
  const map = contentMap ?? {};
  const layoutRaw = contentOverride(map, sectionId, "layout", fallback.layout)
    .trim()
    .toLowerCase();

  return {
    eyebrow: contentOverride(map, sectionId, "eyebrow", fallback.eyebrow),
    title: contentOverride(map, sectionId, "title", fallback.title),
    description: contentOverride(map, sectionId, "description", fallback.description),
    buttonLabel: contentOverride(map, sectionId, "buttonLabel", fallback.buttonLabel),
    buttonHref: contentOverride(map, sectionId, "buttonHref", fallback.buttonHref),
    videoUrl: contentOverride(map, sectionId, "videoUrl", fallback.videoUrl),
    layout: layoutRaw === "split" ? "split" : "fullBanner",
  };
}
