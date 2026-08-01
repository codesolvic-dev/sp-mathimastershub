import React, { useEffect, useState } from "react";
import { getCompany } from "@/api/company.api";
import { getBanners } from "@/api/banner.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import {
  applyCompanyBranding,
  DEFAULT_AUTH_TAGLINE,
  DEFAULT_COMPANY_NAME,
  resolveCompanyAssetUrl,
} from "@/utils/companyBrand";
import {
  getLoginBannerUrl,
  preloadLoginBanner,
  setLoginBannerUrl,
} from "@/utils/authBanner";

/**
 * AuthLayout
 * Left column (360px): logo/brand
 * Right column (360px): form fields
 * Uses theme color for border and accents.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [loginBannerUrl, setLoginBannerUrlState] = useState(() => getLoginBannerUrl());
  const [company, setCompany] = useState<{
    company: string;
    logo: string;
    favicon: string;
    authTagline?: string | null;
  }>({
    company: DEFAULT_COMPANY_NAME,
    logo: "",
    favicon: "",
    authTagline: undefined,
  });

  useEffect(() => {
    let cancelled = false;

    const applyBanner = async (url: string) => {
      if (!url || cancelled) return;
      await preloadLoginBanner(url);
      if (cancelled) return;
      setLoginBannerUrl(url);
      setLoginBannerUrlState(url);
    };

    getBanners()
      .then((banners) => {
        const loginBanner = banners.find((b) => b.slot === "login");
        const url = loginBanner?.imageUrl?.trim();
        if (url) {
          applyBanner(url);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cachedCompany = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cachedCompany) {
      const normalized = {
        company: cachedCompany.company || DEFAULT_COMPANY_NAME,
        logo: cachedCompany.logo || "",
        favicon: cachedCompany.favicon || "",
        authTagline: cachedCompany.authTagline,
      };
      setCompany(normalized);
      applyCompanyBranding(normalized);
    }

    const loadCompany = async () => {
      try {
        const latest = await getCompany();
        const normalized = {
          company: latest?.company || DEFAULT_COMPANY_NAME,
          logo: latest?.logo || "",
          favicon: latest?.favicon || "",
          authTagline: latest?.authTagline,
        };
        setCompany(normalized);
        if (latest) setCompanyCache(latest);
        applyCompanyBranding(normalized);
      } catch {
        // Don't force Splorem title/favicon on failure
      }
    };
    loadCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authTaglineLine =
    company.authTagline === undefined || company.authTagline === null
      ? DEFAULT_AUTH_TAGLINE
      : String(company.authTagline).trim() === ""
        ? null
        : String(company.authTagline).trim();

  return (
    <div
      className="w-full min-h-screen bg-cover bg-center flex justify-center items-center px-4"
      style={{
        backgroundImage: `url('${loginBannerUrl}')`,
      }}
    >
      <div className="backdrop-blur-xl bg-white/10 border border-[var(--theme-primary,#A8734B)] shadow-2xl rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 w-full max-w-[960px]">
        {/* Left Logo Box (360px) */}
        <div className="w-full md:w-[360px] flex flex-col items-center justify-center gap-4 text-white">
          <img
            src={resolveCompanyAssetUrl(company.logo) || "/logo.png"}
            alt={company.company || "Logo"}
            className="w-32 h-32 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
          <h1 className="text-2xl font-semibold tracking-wide">{`Welcome to ${company.company || DEFAULT_COMPANY_NAME}`}</h1>
          {authTaglineLine && (
            <p className="text-sm text-white/80 text-center px-6">{authTaglineLine}</p>
          )}
        </div>

        {/* Right Content (360px) */}
        <div className="w-full md:w-[360px] rounded-xl p-6 shadow-lg bg-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}
