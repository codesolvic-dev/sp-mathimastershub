import { getCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { companyCacheHasLandingChoice, setCompanyCache } from "@/utils/companyCache";

/** Single shared in-flight getCompany() so App / currency / loader don't triple-fetch on boot. */
let inflight: Promise<any> | null = null;

export async function fetchCompanyShared(options?: {
  preferCache?: boolean;
}): Promise<any> {
  if (options?.preferCache) {
    const cached = getCachedData<Record<string, unknown>>(CACHE_KEYS.COMPANY);
    // Incomplete cache (missing landing) must not short-circuit — that shows classic primary home.
    if (cached && companyCacheHasLandingChoice(cached)) return cached;
  }

  if (inflight) return inflight;

  inflight = getCompany()
    .then((company) => {
      if (company) setCompanyCache(company);
      return company;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
