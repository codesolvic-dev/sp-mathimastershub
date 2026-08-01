import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutTemplate } from "lucide-react";
import { getLandingSections } from "@/api/landingsection.api";
import { getCachedData, setCachedData } from "@/utils/cache";
import { getLandingCacheKeys } from "@/landings/shared/landingCache";
import { SP_ECOM_SUB_PAGES, type SpEcomSubPage } from "@/landings/tertiary/ecomSubPages";

function anySectionEnabled(cacheKey: string): boolean {
  const cached = getCachedData<{ enabled?: boolean }[]>(cacheKey);
  return Array.isArray(cached) && cached.some((s) => s.enabled);
}

function SubPageRow({
  page,
  visible,
  highlighted,
  onOpen,
}: {
  page: SpEcomSubPage;
  visible: boolean;
  highlighted?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left px-6 py-5 transition-colors border-b border-gray-100 last:border-b-0 ${
        highlighted
          ? "bg-[var(--theme-primary)]/8 hover:bg-[var(--theme-primary)]/12"
          : "bg-gray-50/80 hover:bg-gray-100/80"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className={`text-lg font-semibold ${
              highlighted ? "theme-text-primary" : "text-gray-900"
            }`}
          >
            {page.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{page.subInfo}</p>
          <div
            className={`mt-3 h-px max-w-md ${
              highlighted ? "bg-[var(--theme-primary)]/25" : "bg-gray-200"
            }`}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
          {visible ? "Visible on site" : "Hidden on site"}
        </span>
      </div>
    </button>
  );
}

export default function SpEcomPage() {
  const navigate = useNavigate();
  const homeKey = getLandingCacheKeys("tertiary").FULL;
  const productKey = getLandingCacheKeys("tertiary-product").FULL;
  const aboutKey = getLandingCacheKeys("tertiary-about").FULL;

  const [homeVisible, setHomeVisible] = useState(() => anySectionEnabled(homeKey));
  const [productDetailVisible, setProductDetailVisible] = useState(() =>
    anySectionEnabled(productKey)
  );
  const [aboutVisible, setAboutVisible] = useState(() => anySectionEnabled(aboutKey));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [homeSections, productSections, aboutSections] = await Promise.all([
          getLandingSections("tertiary").catch(() => []),
          getLandingSections("tertiary-product").catch(() => []),
          getLandingSections("tertiary-about").catch(() => []),
        ]);
        if (!cancelled) {
          if (Array.isArray(homeSections)) setCachedData(homeKey, homeSections);
          if (Array.isArray(productSections)) setCachedData(productKey, productSections);
          if (Array.isArray(aboutSections)) setCachedData(aboutKey, aboutSections);
          setHomeVisible(
            Array.isArray(homeSections) && homeSections.some((s: { enabled?: boolean }) => s.enabled)
          );
          setProductDetailVisible(
            Array.isArray(productSections) &&
              productSections.some((s: { enabled?: boolean }) => s.enabled)
          );
          setAboutVisible(
            Array.isArray(aboutSections) &&
              aboutSections.some((s: { enabled?: boolean }) => s.enabled)
          );
        }
      } catch {
        if (!cancelled) {
          setHomeVisible(false);
          setProductDetailVisible(false);
          setAboutVisible(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openSubPage = (page: SpEcomSubPage) => {
    if (page.hasBuilder) {
      navigate(`/developer/sp-ecom/${page.slug}/builder`);
      return;
    }
    navigate(`/developer/sp-ecom/${page.slug}`);
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold theme-heading">Sp - eCom</h1>
        <button
          type="button"
          onClick={() => navigate("/developer/sp-ecom/home/builder")}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg theme-button"
        >
          <LayoutTemplate className="w-4 h-4" />
          Edit with SpBuilder
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {SP_ECOM_SUB_PAGES.map((page, index) => (
            <SubPageRow
              key={page.slug}
              page={page}
              highlighted={index === 0}
              visible={
                page.slug === "home"
                  ? homeVisible
                  : page.slug === "product-detail"
                    ? productDetailVisible
                    : page.slug === "about"
                      ? aboutVisible
                      : false
              }
              onOpen={() => openSubPage(page)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
