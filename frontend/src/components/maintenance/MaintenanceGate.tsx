import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchCompanyShared } from "@/utils/companyFetch";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { COMPANY_UPDATED_EVENT } from "@/utils/companyCache";
import {
  isMaintenanceExemptPath,
  normalizeMaintenanceMode,
  type MaintenanceModeSettings,
} from "@/utils/maintenanceMode";
import MaintenancePage from "@/components/maintenance/MaintenancePage";

type CompanySnapshot = {
  company?: string;
  logo?: string;
  email?: string;
  phone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  maintenanceMode?: Partial<MaintenanceModeSettings>;
};

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [company, setCompany] = useState<CompanySnapshot | null>(() => {
    return getCachedData<CompanySnapshot>(CACHE_KEYS.COMPANY) || null;
  });

  const syncFromCacheOrFetch = useCallback(async () => {
    const cached = getCachedData<CompanySnapshot>(CACHE_KEYS.COMPANY);
    if (cached) setCompany(cached);
    try {
      const data = await fetchCompanyShared({ preferCache: false });
      if (data) setCompany(data);
    } catch {
      // keep cache
    }
  }, []);

  useEffect(() => {
    syncFromCacheOrFetch();
  }, [syncFromCacheOrFetch]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CompanySnapshot>).detail;
      if (detail) setCompany(detail);
      else {
        const cached = getCachedData<CompanySnapshot>(CACHE_KEYS.COMPANY);
        if (cached) setCompany(cached);
      }
    };
    window.addEventListener(COMPANY_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(COMPANY_UPDATED_EVENT, onUpdated);
  }, []);

  useEffect(() => {
    const settings = normalizeMaintenanceMode(company?.maintenanceMode);
    if (!settings.enabled) return;
    if (settings.redirectUrl && !isMaintenanceExemptPath(location.pathname, settings)) {
      const url = settings.redirectUrl.trim();
      if (url.startsWith("http")) {
        window.location.replace(url);
      }
    }
    if (settings.seoTitle) {
      document.title = settings.seoTitle;
    }
    let robots = document.querySelector('meta[name="robots"]');
    if (settings.seoNoIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    }
  }, [company, location.pathname]);

  const settings = normalizeMaintenanceMode(company?.maintenanceMode);
  const forcePreview =
    typeof window !== "undefined" &&
    sessionStorage.getItem("force-maintenance-preview") === "1";
  const exempt = isMaintenanceExemptPath(location.pathname, settings);

  if ((settings.enabled || forcePreview) && !exempt) {
    const withContact = {
      ...settings,
      contactEmail: settings.contactEmail || company?.email || "",
      contactPhone: settings.contactPhone || company?.phone || "",
    };
    return (
      <MaintenancePage
        settings={withContact}
        companyName={company?.company || ""}
        logoUrl={company?.logo || ""}
        socialLinks={company?.socialLinks}
      />
    );
  }

  return <>{children}</>;
}
