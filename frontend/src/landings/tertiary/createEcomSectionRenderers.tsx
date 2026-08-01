import React from "react";
import {
  EcomHeroSlider,
  EcomRoundCategoriesSection,
  EcomCategoriesTabsSection,
  EcomProductsWomenSectionWithContent,
  EcomProductsMenSectionWithContent,
  EcomTrustBarSection,
  EcomBrandPromoSection,
  EcomBrandPromoSection2,
  EcomTestimonialSliderSection,
  EcomBlogFeedSection,
  EcomReviewsSupportSection,
} from "./EcomLandingSections";
import { EcomCategoryHeroSection } from "./EcomCategoryHeroSection";
import { EcomReelsSection } from "./EcomReelsSection";
import { aliasSectionContentMap } from "@/utils/landingSectionContent";

type BannerSlice = { imageUrl?: string; title?: string; subtitle?: string; targetUrl?: string };

/** Prefer dedicated brand-promo slot; only borrow YouTube URL from hero slide, not its image. */
function pickPromoBanner(
  slot: "brand-promo-1" | "brand-promo-2",
  fallbackSlot: "hero-secondary" | "hero-tertiary",
  bannersBySlot: Record<string, BannerSlice>
): BannerSlice | undefined {
  const dedicated = bannersBySlot[slot];
  if (dedicated) return dedicated;
  const fallback = bannersBySlot[fallbackSlot];
  if (fallback?.targetUrl?.trim()) {
    return { targetUrl: fallback.targetUrl };
  }
  return undefined;
}

export function createEcomSectionRenderers(
  bannersBySlot: Record<string, BannerSlice>,
  sectionContentMap?: Record<string, Record<string, string>>
) {
  const heroSlides = (["hero-main", "hero-secondary", "hero-tertiary"] as const).flatMap(
    (slot, slideIndex) => {
      const b = bannersBySlot[slot];
      if (!b?.imageUrl) return [];
      const slide: {
        slideIndex: number;
        image: string;
        targetUrl?: string;
        buttonHref?: string;
      } = {
        slideIndex,
        image: b.imageUrl,
      };
      if (b.targetUrl?.trim()) {
        slide.targetUrl = b.targetUrl.trim();
        slide.buttonHref = b.targetUrl.trim();
      }
      return [slide];
    }
  );

  const promoBanner1 = pickPromoBanner("brand-promo-1", "hero-secondary", bannersBySlot);
  const promoBanner2 = pickPromoBanner("brand-promo-2", "hero-tertiary", bannersBySlot);

  return {
    hero: () => <EcomHeroSlider slides={heroSlides} contentMap={sectionContentMap} />,
    "ecom-categories-round": () => <EcomRoundCategoriesSection contentMap={sectionContentMap} />,
    "ecom-category-hero": () => <EcomCategoryHeroSection contentMap={sectionContentMap} />,
    "ecom-categories-tabs": () => <EcomCategoriesTabsSection contentMap={sectionContentMap} />,
    categories: () => <EcomRoundCategoriesSection contentMap={sectionContentMap} />,
    "ecom-products-women": () => <EcomProductsWomenSectionWithContent contentMap={sectionContentMap} />,
    "ecom-products-men": () => <EcomProductsMenSectionWithContent contentMap={sectionContentMap} />,
    "ecom-trust-bar": () => <EcomTrustBarSection contentMap={sectionContentMap} />,
    "ecom-brand-promo": () => (
      <EcomBrandPromoSection contentMap={sectionContentMap} banner={promoBanner1} />
    ),
    "ecom-brand-promo-2": () => (
      <EcomBrandPromoSection2 contentMap={sectionContentMap} banner={promoBanner2} />
    ),
    "ecom-reels": () => <EcomReelsSection contentMap={sectionContentMap} />,
    testimonials: () => <EcomTestimonialSliderSection />,
    "ecom-blog-feed": () => <EcomBlogFeedSection />,
    "ecom-reviews-support": () => <EcomReviewsSupportSection contentMap={sectionContentMap} />,
  } as Record<string, () => React.ReactNode>;
}

/** Registers duplicate sectionIds that point at a built-in template via baseSectionId. */
export function createEcomSectionRenderersWithClones(
  bannersBySlot: Record<string, BannerSlice>,
  sectionContentMap?: Record<string, Record<string, string>>,
  baseSectionIdMap?: Record<string, string>
) {
  const base = createEcomSectionRenderers(bannersBySlot, sectionContentMap);
  if (!baseSectionIdMap || !Object.keys(baseSectionIdMap).length) return base;

  const out: Record<string, () => React.ReactNode> = { ...base };
  for (const [sectionId, templateId] of Object.entries(baseSectionIdMap)) {
    if (!sectionId || !templateId || out[sectionId] || !base[templateId]) continue;
    out[sectionId] = () => {
      const aliased = aliasSectionContentMap(sectionContentMap, sectionId, templateId);
      const renderers = createEcomSectionRenderers(bannersBySlot, aliased);
      return renderers[templateId]?.() ?? null;
    };
  }
  return out;
}
