import {
  contentOverride,
  isContentFlagEnabled,
} from "@/utils/landingSectionContent";

export const ECOM_HERO_SECTION_ID = "hero";
export const ECOM_HERO_SLIDE_COUNT = 3;

export type EcomHeroSlideSettings = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  showTitle: boolean;
  showSubtitle: boolean;
  showButton: boolean;
};

const SLIDE_DEFAULTS: EcomHeroSlideSettings[] = [
  {
    title: "Ready-to-Wear, Ready to Style",
    subtitle: "Discover curated collections for every occasion.",
    buttonLabel: "SHOP NOW",
    buttonHref: "/shop",
    showTitle: true,
    showSubtitle: true,
    showButton: true,
  },
  {
    title: "New Arrivals Every Week",
    subtitle: "Fresh styles and exclusive drops — shop the latest looks.",
    buttonLabel: "SHOP NOW",
    buttonHref: "/shop",
    showTitle: true,
    showSubtitle: true,
    showButton: true,
  },
  {
    title: "Premium Quality, Everyday Comfort",
    subtitle: "Crafted pieces designed for confidence and all-day wear.",
    buttonLabel: "SHOP NOW",
    buttonHref: "/shop",
    showTitle: true,
    showSubtitle: true,
    showButton: true,
  },
];

type TextField = "title" | "subtitle" | "buttonLabel" | "buttonHref";

const LEGACY_KEYS: Record<TextField, string> = {
  title: "title",
  subtitle: "subtitle",
  buttonLabel: "buttonLabel",
  buttonHref: "buttonHref",
};

function readSlideField(
  map: Record<string, Record<string, string>>,
  slideIndex: number,
  field: TextField
): string {
  const slideNum = slideIndex + 1;
  const key = `slide${slideNum}${field.charAt(0).toUpperCase()}${field.slice(1)}` as
    | "slide1Title"
    | "slide1Subtitle"
    | "slide1ButtonLabel"
    | "slide1ButtonHref"
    | "slide2Title"
    | "slide2Subtitle"
    | "slide2ButtonLabel"
    | "slide2ButtonHref"
    | "slide3Title"
    | "slide3Subtitle"
    | "slide3ButtonLabel"
    | "slide3ButtonHref";

  const fromSlide = contentOverride(map, ECOM_HERO_SECTION_ID, key, "");
  if (fromSlide.trim()) return fromSlide;

  if (slideIndex === 0) {
    const legacy = contentOverride(map, ECOM_HERO_SECTION_ID, LEGACY_KEYS[field], "");
    if (legacy.trim()) return legacy;
  }

  return SLIDE_DEFAULTS[slideIndex]?.[field] ?? SLIDE_DEFAULTS[0][field];
}

function readSlideVisibility(
  map: Record<string, Record<string, string>>,
  slideIndex: number,
  field: "ShowTitle" | "ShowSubtitle" | "ShowButton",
  defaultOn: boolean
): boolean {
  const slideNum = slideIndex + 1;
  const key = `slide${slideNum}${field}`;
  const raw = contentOverride(map, ECOM_HERO_SECTION_ID, key, defaultOn ? "yes" : "no");
  return isContentFlagEnabled(raw, defaultOn);
}

export function parseEcomHeroSlideSettings(
  contentMap: Record<string, Record<string, string>> | undefined,
  slideIndex: number
): EcomHeroSlideSettings {
  const map = contentMap ?? {};
  const safeIndex = Math.max(0, Math.min(slideIndex, ECOM_HERO_SLIDE_COUNT - 1));
  const defaults = SLIDE_DEFAULTS[safeIndex] ?? SLIDE_DEFAULTS[0];

  return {
    title: readSlideField(map, safeIndex, "title"),
    subtitle: readSlideField(map, safeIndex, "subtitle"),
    buttonLabel: readSlideField(map, safeIndex, "buttonLabel"),
    buttonHref: readSlideField(map, safeIndex, "buttonHref"),
    showTitle: readSlideVisibility(map, safeIndex, "ShowTitle", defaults.showTitle),
    showSubtitle: readSlideVisibility(map, safeIndex, "ShowSubtitle", defaults.showSubtitle),
    showButton: readSlideVisibility(map, safeIndex, "ShowButton", defaults.showButton),
  };
}

export function parseEcomHeroSlidesSettings(
  contentMap?: Record<string, Record<string, string>>
): EcomHeroSlideSettings[] {
  return Array.from({ length: ECOM_HERO_SLIDE_COUNT }, (_, i) =>
    parseEcomHeroSlideSettings(contentMap, i)
  );
}
