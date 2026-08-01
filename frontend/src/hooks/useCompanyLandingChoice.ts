import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchCompanyShared } from "@/utils/companyFetch";
import {
  COMPANY_UPDATED_EVENT,
  companyCacheHasLandingChoice,
  getCompanyLandingChoice,
} from "@/utils/companyCache";
import type { LandingPageChoice } from "@/utils/landingPage";

export type CompanyLandingState = {
  choice: LandingPageChoice;
  /** False until company API settles — avoids flashing default "Grace" / wrong home. */
  ready: boolean;
};

/** Once per tab session after first successful company load with an explicit landing choice */
let companyBootstrapped = false;

/**
 * Active storefront landing (primary / secondary / tertiary).
 * Blocks first paint of home until company settings are loaded so the
 * active site (e.g. Sp eCom / Sword Empires) shows immediately — not the default Landing.
 */
export function useCompanyLandingChoice(): CompanyLandingState {
  const location = useLocation();
  const [choice, setChoice] = useState<LandingPageChoice>(() => getCompanyLandingChoice());
  const [ready, setReady] = useState(() => companyCacheHasLandingChoice());

  useEffect(() => {
    const syncFromCache = () => {
      setChoice(getCompanyLandingChoice());
    };

    syncFromCache();
    window.addEventListener(COMPANY_UPDATED_EVENT, syncFromCache);

    let cancelled = false;

    const canPreferCache = companyBootstrapped && companyCacheHasLandingChoice();

    fetchCompanyShared({ preferCache: canPreferCache })
      .then(() => {
        if (cancelled) return;
        if (companyCacheHasLandingChoice()) {
          companyBootstrapped = true;
          setChoice(getCompanyLandingChoice());
          setReady(true);
        } else {
          // Network returned something unusable — keep loader off but don't lock primary forever
          setChoice(getCompanyLandingChoice());
          setReady(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Keep last known good landing from cache; never invent "primary" as a successful bootstrap
        setChoice(getCompanyLandingChoice());
        setReady(true);
      });

    return () => {
      cancelled = true;
      window.removeEventListener(COMPANY_UPDATED_EVENT, syncFromCache);
    };
  }, [location.pathname]);

  return { choice, ready };
}
