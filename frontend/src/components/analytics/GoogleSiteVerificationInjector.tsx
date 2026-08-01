import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { COMPANY_UPDATED_EVENT } from "@/utils/companyCache";
import {
  applyGoogleSiteVerification,
  parseGoogleSiteVerificationInput,
} from "@/utils/googleSiteVerification";

/**
 * Keeps google-site-verification meta in the live document head
 * (Elements panel + react-helmet). Complements Vite HTML inject for View Source.
 */
export default function GoogleSiteVerificationInjector() {
  const [token, setToken] = useState(() =>
    parseGoogleSiteVerificationInput(
      getCachedData<{ googleSiteVerification?: string }>(CACHE_KEYS.COMPANY)
        ?.googleSiteVerification
    )
  );

  useEffect(() => {
    const sync = (raw: unknown) => {
      const next = parseGoogleSiteVerificationInput(raw);
      setToken(next);
      applyGoogleSiteVerification(next);
    };

    sync(
      getCachedData<{ googleSiteVerification?: string }>(CACHE_KEYS.COMPANY)
        ?.googleSiteVerification
    );

    const onCompany = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { googleSiteVerification?: string }
        | undefined;
      if (detail && "googleSiteVerification" in detail) {
        sync(detail.googleSiteVerification);
      }
    };
    window.addEventListener(COMPANY_UPDATED_EVENT, onCompany);

    void getCompany()
      .then((data) => {
        if (data?.googleSiteVerification !== undefined) {
          sync(data.googleSiteVerification);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener(COMPANY_UPDATED_EVENT, onCompany);
  }, []);

  if (!token) return null;

  return (
    <Helmet>
      <meta name="google-site-verification" content={token} />
    </Helmet>
  );
}
