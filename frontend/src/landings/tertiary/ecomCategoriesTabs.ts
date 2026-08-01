import { contentOverride } from "@/utils/landingSectionContent";

export const ECOM_CATEGORIES_TABS_SECTION_ID = "ecom-categories-tabs";

export type EcomCategoriesTabsTextAlign = "left" | "center" | "right";

export type EcomCategoriesTabsSettings = {
  title: string;
  subtitle: string;
  textAlign: EcomCategoriesTabsTextAlign;
  showCategoryTabs: boolean;
  showHeaderButton: boolean;
  buttonLabel: string;
  buttonHref: string;
  productsPerRow: 3 | 4 | 5;
  productsCount: number;
};

function parseTextAlign(raw: string): EcomCategoriesTabsTextAlign {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "left" || v === "right" || v === "center") return v;
  return "center";
}

export function parseEcomCategoriesTabsSettings(
  contentMap?: Record<string, Record<string, string>>
): EcomCategoriesTabsSettings {
  const map = contentMap ?? {};
  const perRowRaw = Number(
    contentOverride(map, ECOM_CATEGORIES_TABS_SECTION_ID, "productsPerRow", "5")
  );
  const countRaw = Number(
    contentOverride(map, ECOM_CATEGORIES_TABS_SECTION_ID, "productsCount", "10")
  );
  const showHeaderButtonRaw = contentOverride(
    map,
    ECOM_CATEGORIES_TABS_SECTION_ID,
    "showHeaderButton",
    "no"
  );
  const showCategoryTabsRaw = contentOverride(
    map,
    ECOM_CATEGORIES_TABS_SECTION_ID,
    "showCategoryTabs",
    "yes"
  );

  const productsPerRow = ([3, 4, 5] as const).includes(perRowRaw as 3 | 4 | 5)
    ? (perRowRaw as 3 | 4 | 5)
    : 5;

  return {
    title: contentOverride(
      map,
      ECOM_CATEGORIES_TABS_SECTION_ID,
      "title",
      "Shop by Category"
    ),
    subtitle: contentOverride(
      map,
      ECOM_CATEGORIES_TABS_SECTION_ID,
      "subtitle",
      "Browse products from every category"
    ),
    textAlign: parseTextAlign(
      contentOverride(map, ECOM_CATEGORIES_TABS_SECTION_ID, "textAlign", "center")
    ),
    showCategoryTabs: showCategoryTabsRaw !== "no",
    showHeaderButton: showHeaderButtonRaw === "yes",
    buttonLabel: contentOverride(map, ECOM_CATEGORIES_TABS_SECTION_ID, "buttonLabel", "Explore All"),
    buttonHref: contentOverride(map, ECOM_CATEGORIES_TABS_SECTION_ID, "buttonHref", ""),
    productsPerRow,
    productsCount: Math.min(24, Math.max(1, Number.isFinite(countRaw) ? countRaw : 10)),
  };
}
