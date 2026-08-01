import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { fetchCompanyShared } from "@/utils/companyFetch";
import { applyGoogleSiteVerification } from "@/utils/googleSiteVerification";

export type CompanyBrandData = {
  company?: string;
  logo?: string;
  favicon?: string;
  phone?: string;
  googleSiteVerification?: string;
};

/** UI fallback only (navbar labels, etc.) — never used as interim browser tab title after cache clear. */
export const DEFAULT_COMPANY_NAME = "Splorem";

/** Shown on login/access auth layouts when company has no custom auth tagline saved yet. */
export const DEFAULT_AUTH_TAGLINE =
  "Handcrafted essentials with a touch of elegance.";

export function resolveCompanyAssetUrl(value?: string): string {
  if (!value || typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();

  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const rawApiUrl = typeof import.meta.env.VITE_API_URL === "string" ? import.meta.env.VITE_API_URL : "";
  const baseUrl = rawApiUrl.replace(/\/$/, "").replace(/\/api$/, "");
  if (!baseUrl) return trimmed;

  return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

export function normalizePhoneForWhatsApp(phone?: string): string {
  return (phone || "").replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone?: string, message?: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return "#";
  const baseUrl = `https://wa.me/${normalized}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}

/**
 * Apply live company tab title + favicon.
 * Does not inject hardcoded "Splorem" — after cookies/cache clear we wait for API data.
 * Favicon preference: company favicon → logo.
 */
export function applyCompanyBranding(company: CompanyBrandData | null | undefined): void {
  if (typeof document === "undefined" || !company) return;

  const companyName = company.company?.trim();
  if (companyName) {
    document.title = companyName;
  }

  if (company.googleSiteVerification !== undefined) {
    applyGoogleSiteVerification(company.googleSiteVerification);
  }

  const iconSource = company.favicon?.trim() || company.logo?.trim();
  if (!iconSource) return;

  const resolvedIcon = resolveCompanyAssetUrl(iconSource);
  if (!resolvedIcon) return;

  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  if (link.href !== resolvedIcon) {
    link.href = resolvedIcon;
  }
}

/** Start company branding as early as possible (before/alongside React boot). */
export function bootstrapCompanyBranding(): void {
  if (typeof document === "undefined") return;

  const cached = getCachedData<CompanyBrandData>(CACHE_KEYS.COMPANY);
  if (cached) {
    applyCompanyBranding(cached);
    // Always apply GSC from cache even when branding fields are sparse
    if (cached.googleSiteVerification) {
      applyGoogleSiteVerification(cached.googleSiteVerification);
    }
  }

  void fetchCompanyShared()
    .then((company) => {
      const latest =
        getCachedData<CompanyBrandData>(CACHE_KEYS.COMPANY) || company;
      if (latest) applyCompanyBranding(latest);
    })
    .catch(() => {
      /* keep blank index.html title/icon until company is available */
    });
}
