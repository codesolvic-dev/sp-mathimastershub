import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";
import {
  DEFAULT_LANDING_PAGE,
  type LandingPageChoice,
  normalizeLandingPageChoice,
} from "@/utils/landingPage";

export const COMPANY_UPDATED_EVENT = "company-updated";

function hasExplicitLandingPage(value: unknown): value is LandingPageChoice {
  return value === "primary" || value === "secondary" || value === "tertiary";
}

/** True when cached company includes an explicit home landing choice. */
export function companyCacheHasLandingChoice(
  company?: { defaultLandingPage?: unknown } | null
): boolean {
  const data = company ?? getCachedData<{ defaultLandingPage?: unknown }>(CACHE_KEYS.COMPANY);
  return hasExplicitLandingPage(data?.defaultLandingPage);
}

export function getCompanyLandingChoice(): LandingPageChoice {
  const company = getCachedData<{ defaultLandingPage?: unknown }>(CACHE_KEYS.COMPANY);
  return normalizeLandingPageChoice(company?.defaultLandingPage ?? DEFAULT_LANDING_PAGE);
}

/**
 * Merge + write company cache. Preserves existing `defaultLandingPage` when the
 * incoming payload omits it (partial updates / poison fallbacks must not reset home).
 * Same for `googleSiteVerification` when the key is missing from a partial payload.
 */
export function setCompanyCache(data: Record<string, unknown>): void {
  const existing = getCachedData<Record<string, unknown>>(CACHE_KEYS.COMPANY) || {};
  const incomingLanding = data.defaultLandingPage;
  const landingSource = hasExplicitLandingPage(incomingLanding)
    ? incomingLanding
    : existing.defaultLandingPage ?? DEFAULT_LANDING_PAGE;

  const hasGscKey = Object.prototype.hasOwnProperty.call(data, "googleSiteVerification");
  const nextGsc = hasGscKey
    ? String(data.googleSiteVerification ?? "").trim()
    : String(existing.googleSiteVerification ?? "").trim();

  const normalized = {
    ...existing,
    ...data,
    currency: (data.currency as string) || (existing.currency as string) || "PKR",
    priceShowDecimals:
      data.priceShowDecimals !== undefined
        ? data.priceShowDecimals !== false
        : existing.priceShowDecimals !== false,
    defaultLandingPage: normalizeLandingPageChoice(landingSource),
    googleSiteVerification: nextGsc,
  };
  setCachedData(CACHE_KEYS.COMPANY, normalized);
  window.dispatchEvent(new CustomEvent(COMPANY_UPDATED_EVENT, { detail: normalized }));
}
