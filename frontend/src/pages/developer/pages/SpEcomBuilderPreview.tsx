import React from "react";
import { ImageIcon, Menu, ShoppingCart, Heart, ChevronLeft, ChevronRight, Search, Lightbulb, Settings, Rocket } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import AboutHero from "@/components/about/AboutHero";
import HowWeWork from "@/components/about/HowWeWork";
import { spItemCard } from "@/utils/spStandards";
import type { LandingSectionItem } from "@/api/landingsection.api";
import CustomSectionFrame from "@/components/developer/CustomSectionFrame";
import {
  parseMultilineStringArray,
  parseStatLinesMultiline,
  parseStepLinesMultiline,
  isContentFlagEnabled,
  SECTION_CONTENT_DEFAULTS,
  resolveSectionTemplateId,
  aliasSectionContentMap,
} from "@/utils/landingSectionContent";
import {
  EcomBrandPromoSection,
  EcomBrandPromoSection2,
  EcomHeroSlider,
  EcomReviewsSupportSection,
} from "@/landings/tertiary/EcomLandingSections";
import { EcomCategoryHeroSection } from "@/landings/tertiary/EcomCategoryHeroSection";
import { EcomReelsSection } from "@/landings/tertiary/EcomReelsSection";
import { useProductDetailStyle } from "@/context/ProductDetailStyleContext";

type PreviewViewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<PreviewViewport, number> = {
  desktop: 0,
  tablet: 768,
  mobile: 375,
};

const NAV_LINKS = ["Home", "Shop", "About", "Contact"];

function NavHeaderWireframe({ viewport }: { viewport: PreviewViewport }) {
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";
  const showFullNav = viewport === "desktop";

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm shrink-0">
      <div className="h-12 sm:h-14 px-3 sm:px-4 flex items-center justify-between gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gray-200 flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4 text-gray-400" />
          </div>
          {!isMobile && (
            <div className="h-3 w-16 sm:w-20 rounded bg-gray-200" aria-hidden />
          )}
        </div>

        {/* Center nav — desktop */}
        {showFullNav && (
          <nav className="flex items-center justify-center gap-5 flex-1 px-2">
            {NAV_LINKS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${
                  i === 0 ? "text-[var(--theme-primary)] underline underline-offset-4" : "text-gray-600"
                }`}
              >
                {label}
              </span>
            ))}
          </nav>
        )}

        {/* Center nav — tablet (fewer links) */}
        {isTablet && (
          <nav className="flex items-center justify-center gap-3 flex-1">
            {NAV_LINKS.slice(0, 3).map((label, i) => (
              <span
                key={label}
                className={`text-xs ${i === 0 ? "text-[var(--theme-primary)] font-medium" : "text-gray-500"}`}
              >
                {label}
              </span>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isMobile && (
            <>
              <Heart className="w-4 h-4 text-gray-400" />
              <ShoppingCart className="w-4 h-4 text-gray-400" />
              <div className="w-7 h-7 rounded-full bg-gray-200 hidden sm:block" />
            </>
          )}
          {(isMobile || isTablet) && (
            <button type="button" className="p-1 text-gray-500" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function CategoriesWireframe() {
  const labels = [
    { name: "Hair Care", count: "23 products" },
    { name: "Eyecare", count: "12 products" },
    { name: "Men Health", count: "8 products" },
    { name: "Multivitamins", count: "15 products" },
  ];
  return (
    <div className="py-4 bg-[#f7f7f7] rounded-lg">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center mb-4">
        Categories
      </p>
      <div className="flex gap-6 justify-center items-end px-4">
        {labels.map((item, i) => (
          <div
            key={item.name}
            className={`text-center shrink-0 ${i === 1 ? "scale-110" : "opacity-60 scale-95"}`}
          >
            <p className={`text-[10px] font-bold text-gray-800 ${i === 1 ? "text-xs" : ""}`}>{item.name}</p>
            <p className="text-[9px] text-gray-400 mt-1">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        <span className="w-6 h-1.5 bg-gray-800 rounded-full" />
        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}

function ShopItemsWireframe() {
  return (
    <div className="py-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Catalogs</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {["Category 1", "Category 2", "Category 3", "View All"].map((label) => (
          <span
            key={label}
            className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600 bg-white"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-2 bg-white">
            <div className="aspect-square bg-gray-200 rounded-md flex items-center justify-center mb-2 relative">
              <ImageIcon className="w-6 h-6 text-gray-400" />
              {i === 2 && (
                <span className="absolute top-1 left-1 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                  20% OFF
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700 truncate">Item Name here</p>
            <p className="text-xs text-gray-500">Rs: 50</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalBannerWireframe() {
  return (
    <div className="flex gap-3 py-2">
      <div className="flex-1 bg-gray-200 rounded-lg h-32 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
      <div className="w-1/3 bg-gray-100 rounded-lg h-32" />
    </div>
  );
}

function TextImageWireframe() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 py-2">
      <div className="flex-1 bg-gray-200 rounded-lg h-28 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
      <div className="flex-1 space-y-2 py-2">
        <div className="h-3 w-3/4 rounded bg-gray-200" />
        <div className="h-2 w-full rounded bg-gray-100" />
        <div className="h-2 w-5/6 rounded bg-gray-100" />
        <div className="h-2 w-4/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}

const STEP_ICONS = [Search, Lightbulb, Settings, Rocket];

function sectionContentVal(
  sectionContentMap: Record<string, Record<string, string>> | undefined,
  sectionId: string,
  key: string
): string {
  return (
    sectionContentMap?.[sectionId]?.[key] ??
    SECTION_CONTENT_DEFAULTS[sectionId]?.[key] ??
    ""
  );
}

function AboutHeroWireframe({
  sectionContentMap,
}: {
  sectionContentMap?: Record<string, Record<string, string>>;
}) {
  const paragraphs =
    parseMultilineStringArray(sectionContentVal(sectionContentMap, "ecom-about-hero", "paragraphs")) ?? [];
  const stats = parseStatLinesMultiline(
    sectionContentVal(sectionContentMap, "ecom-about-hero", "statsLines")
  );
  const showStats = isContentFlagEnabled(
    sectionContentVal(sectionContentMap, "ecom-about-hero", "showStats"),
    true
  );
  return (
    <AboutHero
      title={sectionContentVal(sectionContentMap, "ecom-about-hero", "title")}
      paragraphs={paragraphs}
      stats={stats?.map((s) => ({ value: s.value, label: s.label }))}
      showStats={showStats}
    />
  );
}

function AboutProcessWireframe({
  sectionContentMap,
}: {
  sectionContentMap?: Record<string, Record<string, string>>;
}) {
  const stepLines = parseStepLinesMultiline(
    sectionContentVal(sectionContentMap, "ecom-about-process", "stepsLines")
  );
  return (
    <HowWeWork
      title={sectionContentVal(sectionContentMap, "ecom-about-process", "title")}
      subtitle={sectionContentVal(sectionContentMap, "ecom-about-process", "subtitle")}
      steps={
        stepLines?.map((step, index) => ({
          icon: STEP_ICONS[index % STEP_ICONS.length],
          title: step.title,
          description: step.description,
        })) ?? undefined
      }
    />
  );
}

function HowWeWorkWireframe() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gray-200 mx-auto mb-2" />
          <div className="h-2 w-12 mx-auto rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function GenericWireframe({ label }: { label: string }) {
  return (
    <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg py-8 px-4 text-center">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-xs text-gray-400 mt-1">Section preview</p>
    </div>
  );
}

function CtaBannerWireframe() {
  return (
    <div className="bg-gray-200 rounded-lg h-24 sm:h-28 flex items-center justify-center">
      <span className="text-xs text-gray-500 font-medium">CTA Banner</span>
    </div>
  );
}

function ProductsTabsWireframe({ title }: { title: string }) {
  return (
    <div className="py-2">
      <h3 className="text-lg font-bold text-center text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-center text-gray-400 mb-4">Products with tabs</p>
      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        {["cate 1 (5)", "cate 2 (3)", "cate 3 (8)", "cate 4 (2)"].map((t, i) => (
          <span
            key={t}
            className={`text-xs font-semibold pb-1 border-b-2 ${
              i === 0 ? "border-[var(--theme-primary)] text-[var(--theme-primary)]" : "border-transparent text-gray-400"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className={spItemCard.gridClassName} style={{ rowGap: `${spItemCard.gridRowGapPx}px` }}>
        {[
          { id: "preview-1", name: "Sample Product", price: 99.99 },
          { id: "preview-2", name: "Sample Product", price: 129.99, discount: 20 },
          { id: "preview-3", name: "Sample Product", price: 79.99 },
          { id: "preview-4", name: "Sample Product", price: 149.99 },
          { id: "preview-5", name: "Sample Product", price: 89.99 },
        ].map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            price={item.price}
            image="/product.png"
            offer={item.discount?.toString()}
            discount={item.discount}
            skipWishlist
          />
        ))}
      </div>
    </div>
  );
}

function TrustBarWireframe() {
  const labels = ["Easy 30-day exchange", "Ships across Pakistan", "Cash on delivery", "Online Support"];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 py-2">
      {labels.map((label) => (
        <div key={label} className="flex items-center gap-2 rounded-md bg-[#e9eef5] px-3 py-3 min-h-[3rem]">
          <div className="w-5 h-5 rounded bg-[#1a3d6b]/20 shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-medium text-[#1a3d6b] leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}

function TestimonialSliderWireframe() {
  return (
    <div className="py-4">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shrink-0 w-48 border border-gray-200 rounded-xl p-3 bg-gray-50">
            <p className="text-[10px] text-gray-500 line-clamp-3 mb-2">&quot;Customer review text here...&quot;</p>
            <div className="h-2 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogFeedWireframe() {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden">
          <div className="aspect-[9/6] bg-gray-200 rounded-sm" />
          <div className="pt-2 space-y-1.5">
            <div className="h-3 w-5/6 bg-gray-300 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded" />
            <div className="h-2 w-4/5 bg-gray-100 rounded" />
            <div className="h-2 w-16 bg-gray-300 rounded mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductDetailTopWireframe({ styleId = "1" }: { styleId?: "1" | "2" }) {
  if (styleId === "2") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="aspect-square bg-gray-200 rounded" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 bg-gray-100 rounded shrink-0" />
              ))}
            </div>
          </div>
          <div className="space-y-2 py-1">
            <div className="h-4 w-4/5 bg-gray-300 rounded" />
            <div className="h-5 w-1/3 bg-gray-800 rounded" />
            <div className="h-2 w-full bg-gray-100 rounded" />
            <div className="h-2 w-5/6 bg-gray-100 rounded" />
            <div className="grid grid-cols-2 gap-1.5 pt-2">
              <div className="h-7 bg-gray-800 rounded" />
              <div className="h-7 bg-[var(--theme-primary)]/70 rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-1 pt-1">
          <div className="h-6 bg-gray-100 rounded" />
          <div className="h-6 bg-gray-100 rounded" />
          <div className="h-6 bg-gray-100 rounded" />
        </div>
        <p className="text-[10px] text-center text-gray-400">Product Detail Style 2</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="aspect-square bg-gray-200 rounded-lg" />
        <div className="space-y-2 py-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded" />
          <div className="h-8 w-28 bg-[var(--theme-primary)]/20 rounded mt-4" />
        </div>
      </div>
      <p className="text-[10px] text-center text-gray-400">Product Detail Style 1</p>
    </div>
  );
}

function SimilarProductsWireframe() {
  return (
    <div className="py-2">
      <h3 className="text-sm font-bold text-gray-800 mb-3">Similar Products</h3>
      <div className={spItemCard.gridClassName} style={{ rowGap: `${spItemCard.gridRowGapPx}px` }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] bg-gray-200" />
            <div className="p-2 h-8 bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionWireframe({
  section,
  sectionContentMap,
}: {
  section: LandingSectionItem;
  sectionContentMap?: Record<string, Record<string, string>>;
}) {
  const htmlOverride = typeof section.code === "string" ? section.code.trim() : "";
  if (htmlOverride) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <CustomSectionFrame html={htmlOverride} title={section.label || section.sectionId} />
      </div>
    );
  }

  const templateId = resolveSectionTemplateId(section);
  const contentMap = aliasSectionContentMap(
    sectionContentMap,
    section.sectionId,
    templateId
  );

  switch (templateId) {
    case "hero":
      return (
        <EcomHeroSlider
          slides={[
            { slideIndex: 0, image: "/hero.png" },
            { slideIndex: 1, image: "/hero.png" },
            { slideIndex: 2, image: "/hero.png" },
          ]}
          contentMap={contentMap}
        />
      );
    case "ecom-categories-round":
    case "categories":
      return <CategoriesWireframe />;
    case "ecom-category-hero":
      return <EcomCategoryHeroSection contentMap={contentMap} />;
    case "ecom-categories-tabs":
      return <ProductsTabsWireframe title={section.label || "Shop by Category"} />;
    case "ecom-products-women":
      return <ProductsTabsWireframe title={section.label || "Women"} />;
    case "ecom-products-men":
      return <ProductsTabsWireframe title={section.label || "Men"} />;
    case "ecom-similar-products":
      return <SimilarProductsWireframe />;
    case "ecom-trust-bar":
      return <TrustBarWireframe />;
    case "ecom-brand-promo":
      return <EcomBrandPromoSection contentMap={contentMap} />;
    case "ecom-brand-promo-2":
      return <EcomBrandPromoSection2 contentMap={contentMap} />;
    case "ecom-reels":
      return <EcomReelsSection contentMap={contentMap} />;
    case "testimonials":
      return <TestimonialSliderWireframe />;
    case "ecom-blog-feed":
      return <BlogFeedWireframe />;
    case "ecom-reviews-support":
      return <EcomReviewsSupportSection contentMap={contentMap} />;
    case "shop-items":
      return <ShopItemsWireframe />;
    case "vertical-banner":
      return <VerticalBannerWireframe />;
    case "text-image":
      return <TextImageWireframe />;
    case "how-we-work":
      return <HowWeWorkWireframe />;
    case "ecom-about-hero":
      return <AboutHeroWireframe sectionContentMap={contentMap} />;
    case "ecom-about-process":
      return <AboutProcessWireframe sectionContentMap={contentMap} />;
    case "cta-banner-2":
    case "cta-banner-1":
    case "cta-banner-3":
    case "cta-banner-4":
      return <CtaBannerWireframe />;
    default:
      return <GenericWireframe label={section.label} />;
  }
}

interface SpEcomBuilderPreviewProps {
  sections: LandingSectionItem[];
  viewport: PreviewViewport;
  variant?: "home" | "product-detail" | "about";
  sectionContentMap?: Record<string, Record<string, string>>;
}

export default function SpEcomBuilderPreview({
  sections,
  viewport,
  variant = "home",
  sectionContentMap,
}: SpEcomBuilderPreviewProps) {
  const { productDetailStyle } = useProductDetailStyle();
  // Keep sidebar drag order; only show toggled-on sections
  const orderedVisible = sections.filter((s) => s.enabled);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-gray-100">
      <div className="p-4 flex justify-center min-h-full">
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 w-full h-auto"
          style={{
            maxWidth: VIEWPORT_WIDTHS[viewport] === 0 ? "100%" : `${VIEWPORT_WIDTHS[viewport]}px`,
          }}
        >
          <NavHeaderWireframe viewport={viewport} />
          <div className="p-4 sm:p-6 space-y-6 pb-8">
            {variant === "product-detail" && (
              <ProductDetailTopWireframe styleId={productDetailStyle} />
            )}
            {orderedVisible.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                Enable sections on the left to see preview
              </div>
            ) : (
              orderedVisible.map((section) => (
                <div key={section._id} data-section-id={section.sectionId}>
                  <SectionWireframe section={section} sectionContentMap={sectionContentMap} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PreviewViewport };
export { VIEWPORT_WIDTHS };
