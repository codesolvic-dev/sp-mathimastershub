/** Company brand name (navbar / loader) typography — selected in Company settings. */

export const BRAND_NAME_FONT_FAMILIES = [
  { id: "Inter", label: "Inter (Simple)", stack: '"Inter", sans-serif', google: "Inter" },
  { id: "Poppins", label: "Poppins", stack: '"Poppins", sans-serif', google: "Poppins" },
  { id: "Roboto", label: "Roboto", stack: '"Roboto", sans-serif', google: "Roboto" },
  { id: "Open Sans", label: "Open Sans", stack: '"Open Sans", sans-serif', google: "Open+Sans" },
  { id: "Lato", label: "Lato", stack: '"Lato", sans-serif', google: "Lato" },
  { id: "Montserrat", label: "Montserrat", stack: '"Montserrat", sans-serif', google: "Montserrat" },
  { id: "Playfair Display", label: "Playfair Display", stack: '"Playfair Display", serif', google: "Playfair+Display" },
  { id: "Georgia", label: "Georgia", stack: "Georgia, serif", google: null },
  { id: "system-ui", label: "System default", stack: 'system-ui, -apple-system, "Segoe UI", sans-serif', google: null },
] as const;

export const BRAND_NAME_FONT_WEIGHTS = [
  { id: "400", label: "Regular (400)" },
  { id: "500", label: "Medium (500)" },
  { id: "600", label: "Semibold (600)" },
  { id: "700", label: "Bold (700)" },
  { id: "800", label: "Extra Bold (800)" },
] as const;

export const DEFAULT_BRAND_NAME_FONT_FAMILY = "Inter";
export const DEFAULT_BRAND_NAME_FONT_WEIGHT = "600";

const FAMILY_IDS = new Set(BRAND_NAME_FONT_FAMILIES.map((f) => f.id));
const WEIGHT_IDS = new Set(BRAND_NAME_FONT_WEIGHTS.map((w) => w.id));

export function normalizeBrandNameFontFamily(raw?: string | null): string {
  const v = String(raw || "").trim();
  return FAMILY_IDS.has(v as (typeof BRAND_NAME_FONT_FAMILIES)[number]["id"])
    ? v
    : DEFAULT_BRAND_NAME_FONT_FAMILY;
}

export function normalizeBrandNameFontWeight(raw?: string | number | null): string {
  const v = String(raw ?? "").trim();
  return WEIGHT_IDS.has(v as (typeof BRAND_NAME_FONT_WEIGHTS)[number]["id"])
    ? v
    : DEFAULT_BRAND_NAME_FONT_WEIGHT;
}

export function getBrandNameFontStack(familyId?: string | null): string {
  const id = normalizeBrandNameFontFamily(familyId);
  return BRAND_NAME_FONT_FAMILIES.find((f) => f.id === id)?.stack || '"Inter", sans-serif';
}

/** Load Google Font stylesheet once per family (weights 400–800). */
export function ensureBrandNameGoogleFont(familyId?: string | null): void {
  if (typeof document === "undefined") return;
  const id = normalizeBrandNameFontFamily(familyId);
  const meta = BRAND_NAME_FONT_FAMILIES.find((f) => f.id === id);
  if (!meta?.google) return;

  const linkId = `brand-name-font-${meta.google.replace(/\+/g, "-")}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${meta.google}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

export type BrandNameFontStyle = {
  fontFamily: string;
  fontWeight: number | string;
};

export function getBrandNameFontStyle(
  familyId?: string | null,
  weightId?: string | number | null
): BrandNameFontStyle {
  ensureBrandNameGoogleFont(familyId);
  return {
    fontFamily: getBrandNameFontStack(familyId),
    fontWeight: normalizeBrandNameFontWeight(weightId),
  };
}
