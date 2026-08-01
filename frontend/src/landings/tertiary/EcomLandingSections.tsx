import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Star, User, BadgeCheck } from "lucide-react";
import EcomTrustBar from "@/components/ecom/EcomTrustBar";
import ProductGrid from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicButton from "@/components/ui/buttons/DynamicButton";
import CircularLoader from "@/components/ui/CircularLoader";
import WriteReviewDialog, { type WriteReviewPreset } from "@/components/ecom/WriteReviewDialog";
import { getProducts } from "@/api/product.api";
import { getCategories } from "@/api/category.api";
import { getBlogs } from "@/api/blog.api";
import BlogCard from "@/components/blog/BlogCard";
import { getPublicReviews, type PublicReview } from "@/api/review.api";
import { Label } from "@/components/ui/label";
import { spacing } from "@/utils/spacing";
import { spText } from "@/utils/typography";
import { toSpProductCardItem } from "@/utils/spStandards";
import { ECOM_SECTION_INNER, ECOM_PRODUCTS_PER_ROW } from "./constants";
import { parseEcomCategoriesTabsSettings } from "./ecomCategoriesTabs";
import {
  ECOM_BRAND_PROMO_2_SECTION_ID,
  ECOM_BRAND_PROMO_SECTION_ID,
  parseEcomBrandPromoSettings,
} from "./ecomBrandPromo";
import { parseEcomHeroSlideSettings } from "./ecomHero";
import { parseEcomReviewsSupportSettings } from "./ecomReviewsSupport";
import { buildWhatsAppUrl } from "@/utils/companyBrand";
import { youtubeEmbedSrc, youtubeThumbnailUrl } from "@/utils/youtubeEmbed";
import { navigateApp } from "@/utils/navigateApp";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/utils/cache";
import { contentOverride, isCategoryInSelection, parseCategorySelectionCsv } from "@/utils/landingSectionContent";

type BannerSlice = { imageUrl?: string; title?: string; subtitle?: string; targetUrl?: string };

type HeroSlide = {
  /** 0 = hero-main, 1 = hero-secondary, 2 = hero-tertiary */
  slideIndex: number;
  image: string;
  /** Banner Target URL — whole image is clickable when set */
  targetUrl?: string;
  buttonHref?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  image1?: string;
  category?: { _id?: string; name?: string } | string;
};

type Category = { _id: string; name: string; icon?: string };

type TabCategory = { id: string; label: string; count: number };
type ProductTabsSectionSettings = {
  title: string;
  subtitle: string;
  textAlign: "left" | "center" | "right";
  showCategoryTabs: boolean;
  categoryIds: string[];
  productsPerRow: 3 | 4 | 5;
  rows: 1 | 2;
  showHeaderButton: boolean;
  buttonLabel: string;
  buttonHref: string;
};

function shopCategoryPath(categoryName?: string | null): string {
  const name = String(categoryName || "").trim();
  if (!name) return "/shop";
  return `/shop?category=${encodeURIComponent(name)}`;
}

/** True when href is empty or a bare /shop link (no category query). */
function isPlainShopHref(href: string): boolean {
  const h = href.trim().toLowerCase();
  if (!h) return true;
  if (h.includes("?") || h.includes("#")) {
    const query = (h.split("?")[1] || "").split("#")[0].trim();
    if (query) return false;
  }
  try {
    const path = h.startsWith("http") ? new URL(h).pathname : h.split("?")[0];
    const normalized = path.replace(/\/+$/, "") || "/";
    return normalized === "/shop" || normalized === "shop";
  } catch {
    return h === "/shop" || h === "shop" || h === "/shop/";
  }
}

function EcomSectionViewAllButton({
  label,
  buttonHref,
  onDefaultButtonClick,
  textAlign = "center",
}: {
  label: string;
  buttonHref: string;
  onDefaultButtonClick: () => void;
  textAlign?: "left" | "center" | "right";
}) {
  const trimmed = label.trim();
  if (!trimmed) return null;

  const alignClass =
    textAlign === "left"
      ? "justify-start"
      : textAlign === "right"
        ? "justify-end"
        : "justify-center";

  const handleButtonClick = () => {
    const href = buttonHref.trim();
    // Explicit custom link (not bare /shop) — open in top window (never iframe)
    if (href && !isPlainShopHref(href)) {
      navigateApp(href);
      return;
    }
    onDefaultButtonClick();
  };

  return (
    <div className={`flex mt-6 sm:mt-8 ${alignClass}`}>
      <DynamicButton
        label={trimmed}
        variant="filled"
        shape="square"
        className="shrink-0 uppercase tracking-wide underline underline-offset-2"
        onClick={handleButtonClick}
      />
    </div>
  );
}

function EcomProductsSectionHeader({
  title,
  subtitle,
  textAlign = "center",
}: {
  title: string;
  subtitle: string;
  textAlign?: "left" | "center" | "right";
}) {
  const alignClass =
    textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center";

  if (!title.trim() && !subtitle.trim()) return null;

  return (
    <div className={`mb-6 ${alignClass}`}>
      {title.trim() ? <h2 className={spText.h2}>{title}</h2> : null}
      {subtitle.trim() ? (
        <p className={`${spText.paragraph} mt-1`}>{subtitle}</p>
      ) : null}
    </div>
  );
}

const PRODUCT_TABS_MAX = 12;

function readCachedCategories(): Category[] {
  const cached = getCachedData<Category[]>(CACHE_KEYS.CATEGORIES);
  return Array.isArray(cached) ? cached : [];
}

function readCachedProducts(): Product[] {
  const cached = getCachedData<Product[]>(CACHE_KEYS.PRODUCTS);
  if (!Array.isArray(cached)) return [];
  // Drop inactive products from stale cache (status flips in admin)
  return cached.filter(
    (p: Product & { status?: string }) =>
      String(p.status || "active").toLowerCase() !== "inactive"
  );
}

function hydrateHomeCatalog(
  setProducts: (products: Product[]) => void,
  setCategories: (categories: Category[]) => void,
  setLoading: (loading: boolean) => void,
) {
  let cancelled = false;

  Promise.all([getProducts({ activeOnly: true }), getCategories({ activeOnly: true })])
    .then(([prods, cats]) => {
      if (cancelled) return;
      const productList = Array.isArray(prods) ? prods : [];
      const categoryList = Array.isArray(cats) ? cats : [];
      setProducts(productList);
      setCategories(categoryList);
      setCachedData(CACHE_KEYS.PRODUCTS, productList);
      if (categoryList.length > 0) {
        setCachedData(CACHE_KEYS.CATEGORIES, categoryList);
      }
    })
    .catch(() => {
      if (cancelled) return;
      // Keep whatever cache/UI already shows; only clear when we had nothing.
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}

function CategoryRoundImage({ src, alt, name }: { src?: string; alt: string; name: string }) {
  const imageSrc = src?.trim() || "";
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(() =>
    imageSrc ? "loading" : "error"
  );

  useEffect(() => {
    setStatus(imageSrc ? "loading" : "error");
  }, [imageSrc]);

  if (!imageSrc || status === "error") {
    const initial = (name?.charAt(0) || "?").toUpperCase();
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-400">
        {initial}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`ecom-cat-round-img w-full h-full object-cover pointer-events-none transition-all duration-500 ease-in-out group-hover:scale-110 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}

function CategoryRoundStripSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="flex overflow-hidden pb-1 pl-4 sm:pl-6 lg:pl-10 xl:pl-14 pr-4 sm:pr-6 gap-5"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 flex flex-col items-center w-[112px] sm:w-[156px]"
        >
          <Skeleton className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] rounded-full" />
          <Skeleton className="h-4 w-20 mt-2 rounded" />
          <Skeleton className="h-3 w-16 mt-1 rounded" />
        </div>
      ))}
    </div>
  );
}

function CategoryTabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-8 border-b border-gray-200 px-1 pb-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-24 rounded" />
      ))}
    </div>
  );
}

function buildProductCountMap(products: Product[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of products) {
    const id = productCategoryId(p);
    if (id) map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

function buildTabCategories(allCategories: Category[], counts: Map<string, number>): TabCategory[] {
  return allCategories.map((cat) => ({
    id: cat._id,
    label: cat.name,
    count: counts.get(cat._id) ?? 0,
  }));
}

function parseProductsTabsSectionSettings(
  sectionId: string,
  defaults: { title: string; subtitle: string },
  contentMap?: Record<string, Record<string, string>>
): ProductTabsSectionSettings {
  const map = contentMap ?? {};
  const categoriesRaw = contentOverride(map, sectionId, "categories", "");
  const categoryIds = parseCategorySelectionCsv(categoriesRaw);

  const perRowRaw = Number(contentOverride(map, sectionId, "productsPerRow", String(ECOM_PRODUCTS_PER_ROW)));
  const rowsRaw = Number(contentOverride(map, sectionId, "rows", "1"));
  const showHeaderButtonRaw = contentOverride(map, sectionId, "showHeaderButton", "no");
  const showCategoryTabsRaw = contentOverride(map, sectionId, "showCategoryTabs", "yes");
  const textAlignRaw = contentOverride(map, sectionId, "textAlign", "center").trim().toLowerCase();
  const textAlign =
    textAlignRaw === "left" || textAlignRaw === "right" || textAlignRaw === "center"
      ? textAlignRaw
      : "center";

  return {
    title: contentOverride(map, sectionId, "title", defaults.title),
    subtitle: contentOverride(map, sectionId, "subtitle", defaults.subtitle),
    textAlign,
    showCategoryTabs: showCategoryTabsRaw !== "no",
    categoryIds,
    productsPerRow: ([3, 4, 5] as const).includes(perRowRaw as 3 | 4 | 5)
      ? (perRowRaw as 3 | 4 | 5)
      : ECOM_PRODUCTS_PER_ROW,
    rows: rowsRaw === 2 ? 2 : 1,
    showHeaderButton: showHeaderButtonRaw === "yes",
    buttonLabel: contentOverride(map, sectionId, "buttonLabel", "Explore All"),
    buttonHref: contentOverride(map, sectionId, "buttonHref", ""),
  };
}

function productCategoryId(product: Product): string {
  const c = product.category;
  if (!c) return "";
  if (typeof c === "string") return c;
  return c._id ? String(c._id) : "";
}

/** Full-width hero slider ? mockup style with arrows + dots */
export function EcomHeroSlider({
  slides,
  contentMap,
}: {
  slides: HeroSlide[];
  contentMap?: Record<string, Record<string, string>>;
}) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef(0);
  const draggingRef = useRef(false);
  const slideList = useMemo(
    () =>
      slides.length > 0
        ? slides
        : [{ slideIndex: 0, image: "/hero.png" }],
    [slides]
  );
  const total = slideList.length;
  const current = slideList[index];
  const currentSettings = useMemo(
    () => parseEcomHeroSlideSettings(contentMap, current?.slideIndex ?? index),
    [contentMap, current?.slideIndex, index]
  );

  const go = useCallback(
    (dir: -1 | 1) => setIndex((i) => (i + dir + total) % total),
    [total]
  );

  useEffect(() => {
    setIndex(0);
    setImagesReady(false);
    let cancelled = false;
    const loaders = slideList.map(
      (slide) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = slide.image;
        })
    );
    Promise.all(loaders).then(() => {
      if (!cancelled) setImagesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slideList]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = window.setInterval(() => go(1), 6000);
    return () => window.clearInterval(timer);
  }, [total, go]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragDeltaXRef.current = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || dragStartXRef.current == null) return;
    dragDeltaXRef.current = e.clientX - dragStartXRef.current;
  };

  const handleNavigateHref = (href: string) => {
    const url = href.trim();
    if (!url) return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(url);
  };

  const handleShopClick = () => {
    const href =
      currentSettings.buttonHref.trim() ||
      current?.buttonHref?.trim() ||
      current?.targetUrl?.trim() ||
      "/shop";
    handleNavigateHref(href);
  };

  const imageTargetUrl = (current?.targetUrl || current?.buttonHref || "").trim();

  const finishDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const delta = dragDeltaXRef.current;
    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
    const threshold = 45;
    if (total > 1 && Math.abs(delta) >= threshold) {
      go(delta > 0 ? -1 : 1);
      return;
    }
    // Click (not swipe) on hero image → open Target URL
    if (Math.abs(delta) < threshold && imageTargetUrl) {
      handleNavigateHref(imageTargetUrl);
    }
  };

  const displayTitle = currentSettings.title;
  const displaySubtitle = currentSettings.subtitle;

  return (
    <section id="home" className="relative w-full overflow-hidden bg-gray-900">
      <div
        className={`relative w-full aspect-[1080/360] select-none touch-pan-y ${
          imageTargetUrl ? "cursor-pointer" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={finishDrag}
        role={imageTargetUrl ? "link" : undefined}
        aria-label={imageTargetUrl ? "Open banner link" : undefined}
      >
        {slideList.map((slide, i) => (
          <img
            key={`${slide.image}-${i}`}
            src={slide.image}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            draggable={false}
            className={`ecom-hero-slide-img absolute inset-0 w-full h-full object-cover ${
              imagesReady ? "transition-opacity duration-500 ease-in-out" : ""
            } ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          />
        ))}
        {/* <div className="absolute inset-0 bg-black/35 z-20 pointer-events-none" /> */}
        <div className="absolute inset-0 z-20 pointer-events-none" />

        {total > 1 && (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => go(-1)}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-40 p-1 sm:p-1.5 rounded-full bg-black/25 text-white hover:bg-black/40 transition-colors pointer-events-auto"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => go(1)}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-40 p-1 sm:p-1.5 rounded-full bg-black/25 text-white hover:bg-black/40 transition-colors pointer-events-auto"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
            </button>
          </>
        )}

        {(currentSettings.showTitle && displayTitle.trim()) ||
        (currentSettings.showSubtitle && displaySubtitle.trim()) ||
        (currentSettings.showButton && currentSettings.buttonLabel.trim()) ? (
          <div className="absolute bottom-0 left-0 right-0 z-30 px-6 sm:px-10 md:px-16 pb-10 sm:pb-14 pt-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
            <div
              className="pointer-events-auto max-w-xl"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {currentSettings.showTitle && displayTitle.trim() ? (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {displayTitle}
                </h1>
              ) : null}
              {currentSettings.showSubtitle && displaySubtitle.trim() ? (
                <p
                  className={`text-sm sm:text-base text-white/85 max-w-md ${
                    currentSettings.showTitle && displayTitle.trim() ? "mt-2" : ""
                  }`}
                >
                  {displaySubtitle}
                </p>
              ) : null}
              {currentSettings.showButton && currentSettings.buttonLabel.trim() ? (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShopClick();
                  }}
                  className={`px-6 py-2.5 text-sm font-semibold tracking-wide text-white border-2 border-white rounded-sm hover:bg-white hover:text-gray-900 transition-colors ${
                    (currentSettings.showTitle && displayTitle.trim()) ||
                    (currentSettings.showSubtitle && displaySubtitle.trim())
                      ? "mt-4 sm:mt-6"
                      : ""
                  }`}
                >
                  {currentSettings.buttonLabel}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2 pointer-events-auto">
            {slideList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** @deprecated use EcomHeroSlider */
export function EcomHeroSection({ banner }: { banner?: BannerSlice }) {
  return (
    <EcomHeroSlider
      slides={[{ slideIndex: 0, image: banner?.imageUrl || "/hero.png", buttonHref: banner?.targetUrl }]}
    />
  );
}
export function EcomRoundCategoriesSection({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
} = {}) {
  const scrollMode = contentOverride(
    contentMap ?? {},
    "ecom-categories-round",
    "scrollMode",
    "auto",
  );
  const prefersAutoScroll = scrollMode !== "arrows";

  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const manualPauseUntilRef = useRef(0);
  const loopWidthRef = useRef(0);
  const scrollStepRef = useRef(176);
  const touchingRef = useRef(false);
  const initialCached = readCachedCategories();
  const initialCachedProducts = readCachedProducts();
  const [categories, setCategories] = useState<Category[]>(initialCached);
  const [productCounts, setProductCounts] = useState<Map<string, number>>(() =>
    buildProductCountMap(initialCachedProducts),
  );
  const [loading, setLoading] = useState(initialCached.length === 0);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(() => {
    if (!prefersAutoScroll) return false;
    if (typeof window === "undefined") return true;
    // Auto-scroll fights native swipe on phones; keep it for desktop only.
    return !window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  });
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  const ITEM_GAP = 20;
  const AUTO_SCROLL_PX_PER_SEC = 48;
  /** One visible row fits ~8 categories on desktop; below that, arrow mode centers the strip. */
  const ARROW_ROW_CAPACITY = 8;

  useEffect(() => {
    if (!prefersAutoScroll) {
      setAutoScrollEnabled(false);
      return;
    }
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const sync = () => setAutoScrollEnabled(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [prefersAutoScroll]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    Promise.all([getCategories({ activeOnly: true }), getProducts({ activeOnly: true })])
      .then(([cats, prods]) => {
        const list = Array.isArray(cats) ? cats : [];
        const productList = Array.isArray(prods) ? prods : [];
        setCategories(list);
        if (list.length > 0) {
          setCachedData(CACHE_KEYS.CATEGORIES, list);
        }
        setCachedData(CACHE_KEYS.PRODUCTS, productList);
        setProductCounts(buildProductCountMap(productList));
      })
      .catch(() => {
        if (initialCached.length === 0) setCategories([]);
        if (initialCachedProducts.length === 0) setProductCounts(new Map());
      })
      .finally(() => setLoading(false));
  }, []);

  const items = categories;
  // Never force-center on mobile — that clips items and blocks swipe scroll.
  const centerInRow =
    !autoScrollEnabled &&
    !isMobileViewport &&
    items.length > 0 &&
    items.length < ARROW_ROW_CAPACITY;
  const arrowsEnabled = autoScrollEnabled
    ? items.length > 1
    : isMobileViewport
      ? items.length > 1
      : items.length >= ARROW_ROW_CAPACITY;
  const stripItems = useMemo(
    () => (autoScrollEnabled ? [...items, ...items] : items),
    [items, autoScrollEnabled],
  );

  const readLoopMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return null;

    const nodes = el.querySelectorAll("[data-cat-item]");
    if (nodes.length === 0) return null;

    const first = nodes[0] as HTMLElement;
    const second = nodes[1] as HTMLElement;
    const step =
      nodes.length > 1 ? second.offsetLeft - first.offsetLeft : first.offsetWidth + ITEM_GAP;

    scrollStepRef.current = step > 0 ? step : first.offsetWidth + ITEM_GAP;

    if (!autoScrollEnabled) {
      loopWidthRef.current = 0;
      return { loopWidth: 0, step: scrollStepRef.current };
    }

    if (nodes.length < items.length + 1) return null;

    const secondSetFirst = nodes[items.length] as HTMLElement;
    const loopWidth = secondSetFirst.offsetLeft - first.offsetLeft;
    if (loopWidth <= 0) return null;

    loopWidthRef.current = loopWidth;
    return { loopWidth, step: scrollStepRef.current };
  }, [items.length, autoScrollEnabled, ITEM_GAP]);

  const normalizeInfiniteScroll = useCallback(() => {
    if (!autoScrollEnabled) return;

    const el = scrollRef.current;
    const loopWidth = loopWidthRef.current;
    if (!el || loopWidth <= 0) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

    if (el.scrollLeft >= loopWidth) {
      el.scrollLeft -= loopWidth;
    }

    if (maxScroll > 0 && el.scrollLeft >= maxScroll - 1) {
      el.scrollLeft -= loopWidth;
      if (el.scrollLeft < 0) el.scrollLeft = 0;
    }

    if (el.scrollLeft < 0) {
      el.scrollLeft += loopWidth;
    }
  }, [autoScrollEnabled]);

  const pauseAutoScrollBriefly = useCallback(() => {
    manualPauseUntilRef.current = Date.now() + 4500;
  }, []);

  const scrollCategories = useCallback((direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;

    const metrics = readLoopMetrics();
    if (!metrics) return;

    const { loopWidth, step } = metrics;

    if (!autoScrollEnabled) {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const next = el.scrollLeft + direction * step;
      el.scrollTo({ left: Math.max(0, Math.min(next, maxScroll)), behavior: "smooth" });
      return;
    }

    pauseAutoScrollBriefly();
    normalizeInfiniteScroll();

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

    if (direction === 1 && el.scrollLeft + step > maxScroll + 1) {
      el.scrollLeft -= loopWidth;
    } else if (direction === -1 && el.scrollLeft - step < 0) {
      el.scrollLeft += loopWidth;
    }

    el.scrollLeft += direction * step;
    normalizeInfiniteScroll();
  }, [
    items.length,
    autoScrollEnabled,
    pauseAutoScrollBriefly,
    readLoopMetrics,
    normalizeInfiniteScroll,
  ]);

  useEffect(() => {
    const sync = () => {
      readLoopMetrics();
      normalizeInfiniteScroll();
    };

    const timer = window.setTimeout(sync, 60);
    const timerLate = window.setTimeout(sync, 500);

    const el = scrollRef.current;
    if (!el) {
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(timerLate);
      };
    }

    const onScroll = () => normalizeInfiniteScroll();
    if (autoScrollEnabled) {
      el.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", sync);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timerLate);
      if (autoScrollEnabled) {
        el.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", sync);
    };
  }, [stripItems.length, readLoopMetrics, normalizeInfiniteScroll, autoScrollEnabled]);

  useEffect(() => {
    if (!autoScrollEnabled || loading || items.length <= 1) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const el = scrollRef.current;
      let loopWidth = loopWidthRef.current;
      if (loopWidth <= 0) {
        readLoopMetrics();
        loopWidth = loopWidthRef.current;
      }
      const dt = Math.min(now - last, 50);
      last = now;

      if (
        el &&
        loopWidth > 0 &&
        !pausedRef.current &&
        !touchingRef.current &&
        Date.now() >= manualPauseUntilRef.current
      ) {
        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
        el.scrollLeft += (AUTO_SCROLL_PX_PER_SEC * dt) / 1000;

        if (el.scrollLeft >= loopWidth) {
          el.scrollLeft -= loopWidth;
        } else if (maxScroll > 0 && el.scrollLeft >= maxScroll - 1) {
          el.scrollLeft -= loopWidth;
          if (el.scrollLeft < 0) el.scrollLeft = 0;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stripItems.length, loading, items.length, AUTO_SCROLL_PX_PER_SEC, readLoopMetrics, autoScrollEnabled]);

  const arrowBtnClass = (enabled: boolean) =>
    `flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 transition-all duration-300 pointer-events-auto ${
      enabled
        ? "bg-transparent border border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm"
        : "bg-transparent border border-transparent text-gray-400 opacity-50 cursor-not-allowed"
    }`;

  return (
    <section id="ecom-categories-round" className={`bg-white w-full ${spacing.section.gap}`}>
      <div className={ECOM_SECTION_INNER}>
        {/* <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className={spText.h2}>
            Categories
          </h2>
          {(autoScrollEnabled || !centerInRow) && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => arrowsEnabled && scrollCategories(-1)}
              disabled={!arrowsEnabled}
              className={arrowBtnClass(arrowsEnabled)}
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => arrowsEnabled && scrollCategories(1)}
              disabled={!arrowsEnabled}
              className={arrowBtnClass(arrowsEnabled)}
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          )}
        </div> */}
      </div>

      {loading && items.length === 0 ? (
        <CategoryRoundStripSkeleton />
      ) : items.length === 0 ? null : (
      <div
        className={
          centerInRow
            ? "overflow-hidden px-4 sm:px-6 lg:px-8"
            : "pl-4 sm:pl-6 lg:pl-10 xl:pl-14 pr-4 sm:pr-6"
        }
      >
        <div
          ref={scrollRef}
          className={`flex pb-1 touch-pan-x overscroll-x-contain ${
            centerInRow
              ? "justify-center overflow-x-hidden"
              : "overflow-x-auto scrollbar-hide"
          }`}
          style={{
            gap: `${ITEM_GAP}px`,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
          }}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onPointerDown={() => {
            touchingRef.current = true;
            pausedRef.current = true;
            pauseAutoScrollBriefly();
          }}
          onPointerUp={() => {
            touchingRef.current = false;
            pauseAutoScrollBriefly();
          }}
          onPointerCancel={() => {
            touchingRef.current = false;
            pauseAutoScrollBriefly();
          }}
          onTouchStart={() => {
            touchingRef.current = true;
            pausedRef.current = true;
            pauseAutoScrollBriefly();
          }}
          onTouchEnd={() => {
            touchingRef.current = false;
            pauseAutoScrollBriefly();
          }}
          onTouchCancel={() => {
            touchingRef.current = false;
            pauseAutoScrollBriefly();
          }}
        >
          {stripItems.map((cat, i) => {
            const count = productCounts.get(cat._id) ?? 0;
            return (
              <Link
                key={autoScrollEnabled ? `${cat._id}-${i}` : cat._id}
                data-cat-item
                to={shopCategoryPath(cat.name)}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="shrink-0 flex flex-col items-center text-center group py-2 sm:py-4 w-[112px] min-w-[112px] max-w-[112px] sm:w-[156px] sm:min-w-[156px] sm:max-w-[156px]"
              >
                <div
                  className="rounded-full overflow-hidden border-2 border-gray-200 bg-white group-hover:border-[var(--theme-primary)] transition-colors duration-200 w-[100px] h-[100px] min-w-[100px] min-h-[100px] sm:w-[140px] sm:h-[140px] sm:min-w-[140px] sm:min-h-[140px]"
                >
                  <CategoryRoundImage src={cat.icon} alt={cat.name} name={cat.name} />
                </div>

                <span className="mt-2 block text-sm sm:text-sm font-medium text-gray-800 leading-tight line-clamp-2 w-full">
                  {cat.name}
                </span>

                {/* <span className="mt-0.5 block text-sm font-medium text-gray-500 font-normal">
                  {count} product{count !== 1 ? "s" : ""}
                </span> */}
              </Link>
            );
          })}
        </div>
      </div>
      )}
    </section>
  );
}

function ScrollableCategoryTabs({
  tabs,
  activeTab,
  onTabChange,
  textAlign = "center",
}: {
  tabs: TabCategory[];
  activeTab: number;
  onTabChange: (index: number) => void;
  textAlign?: "left" | "center" | "right";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && el.scrollLeft > 4);
    setCanScrollRight(overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollTabIntoView = useCallback((index: number) => {
    const el = scrollRef.current;
    const tab = el?.querySelector(`[data-tab-index="${index}"]`) as HTMLElement | null;
    if (!el || !tab) return;

    const padding = 12;
    const tabLeft = tab.offsetLeft;
    const tabRight = tabLeft + tab.offsetWidth;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;

    if (tabLeft < viewLeft + padding) {
      el.scrollTo({ left: Math.max(0, tabLeft - padding), behavior: "smooth" });
    } else if (tabRight > viewRight - padding) {
      el.scrollTo({
        left: tabRight - el.clientWidth + padding,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateScrollButtons, 50);
    const el = scrollRef.current;
    if (!el) return () => clearTimeout(timer);
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [tabs.length, updateScrollButtons]);

  useEffect(() => {
    scrollTabIntoView(activeTab);
    const timer = setTimeout(updateScrollButtons, 300);
    return () => clearTimeout(timer);
  }, [activeTab, scrollTabIntoView, updateScrollButtons]);

  const scrollTabs = (direction: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  const arrowBtnClass = (enabled: boolean) =>
    `flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0 transition-all duration-300 pointer-events-auto ${
      enabled
        ? "bg-transparent border border-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 hover:shadow-sm"
        : "bg-transparent border border-transparent text-gray-400 opacity-50 cursor-not-allowed"
    }`;

  const tabButtonClass = (isActive: boolean) =>
    `flex-shrink-0 pb-3 text-sm sm:text-base font-bold tracking-wide border-b-2 -mb-px transition-colors whitespace-nowrap ${
      isActive
        ? "border-[var(--theme-primary)] text-[var(--theme-primary)]"
        : "border-transparent text-gray-500 hover:text-gray-800"
    }`;

  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-8 border-b border-gray-200">
      {hasOverflow && (
        <button
          type="button"
          onClick={() => canScrollLeft && scrollTabs(-1)}
          disabled={!canScrollLeft}
          className={arrowBtnClass(canScrollLeft)}
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className={`min-w-0 flex-1 ${hasOverflow ? "overflow-x-auto scrollbar-hide scroll-smooth" : "overflow-visible"}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div
          className={`flex w-max min-w-full gap-6 sm:gap-10 px-1 ${
            hasOverflow
              ? "justify-start"
              : textAlign === "left"
                ? "justify-start"
                : textAlign === "right"
                  ? "justify-end"
                  : "justify-center"
          }`}
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              data-tab-index={i}
              onClick={() => onTabChange(i)}
              className={tabButtonClass(activeTab === i)}
            >
              {tab.label}
              <span className="font-normal text-gray-400"> ({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {hasOverflow && (
        <button
          type="button"
          onClick={() => canScrollRight && scrollTabs(1)}
          disabled={!canScrollRight}
          className={arrowBtnClass(canScrollRight)}
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/** All categories as tabs + products grid (admin: row count + products per category) */
export function EcomCategoriesTabsSection({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
}) {
  const settings = useMemo(() => parseEcomCategoriesTabsSettings(contentMap), [contentMap]);
  const initialCachedProducts = readCachedProducts();
  const initialCachedCategories = readCachedCategories();
  const [products, setProducts] = useState<Product[]>(initialCachedProducts);
  const [categories, setCategories] = useState<Category[]>(initialCachedCategories);
  const [loading, setLoading] = useState(initialCachedProducts.length === 0);
  const [activeTab, setActiveTab] = useState(0);
  const emptyAlignClass =
    settings.textAlign === "left"
      ? "text-left"
      : settings.textAlign === "right"
        ? "text-right"
        : "text-center";

  useEffect(() => hydrateHomeCatalog(setProducts, setCategories, setLoading), []);

  const productCounts = useMemo(() => buildProductCountMap(products), [products]);

  const tabCategories = useMemo(
    () =>
      categories.map((cat) => ({
        id: cat._id,
        label: cat.name,
        count: productCounts.get(cat._id) ?? 0,
      })),
    [categories, productCounts]
  );

  useEffect(() => {
    if (activeTab >= tabCategories.length) setActiveTab(0);
  }, [tabCategories.length, activeTab]);

  const visibleProducts = useMemo(() => {
    if (!settings.showCategoryTabs) {
      return products.slice(0, settings.productsCount);
    }
    const tab = tabCategories[activeTab];
    if (!tab) return [];
    return products
      .filter((p) => productCategoryId(p) === tab.id)
      .slice(0, settings.productsCount);
  }, [products, tabCategories, activeTab, settings.productsCount, settings.showCategoryTabs]);

  const gridItems = useMemo(
    () => visibleProducts.map(toSpProductCardItem),
    [visibleProducts]
  );

  const exploreShop = () => {
    if (settings.showCategoryTabs) {
      const tab = tabCategories[activeTab];
      navigateApp(shopCategoryPath(tab?.label));
      return;
    }
    if (tabCategories.length === 1) {
      navigateApp(shopCategoryPath(tabCategories[0].label));
      return;
    }
    navigateApp("/shop");
  };

  const showViewAll =
    settings.showHeaderButton && settings.buttonLabel.trim().length > 0;

  return (
    <section id="ecom-categories-tabs" className={`bg-white w-full ${spacing.section.gap}`}>
      <div className={ECOM_SECTION_INNER}>
        <EcomProductsSectionHeader
          title={settings.title}
          subtitle={settings.subtitle}
          textAlign={settings.textAlign}
        />

        {settings.showCategoryTabs ? (
          loading ? (
            <CategoryTabsSkeleton count={Math.min(5, settings.productsPerRow + 1)} />
          ) : tabCategories.length === 0 ? (
            <p className={`${emptyAlignClass} text-gray-400 text-sm py-8`}>
              Add categories in Admin ? Categories to show tabs here.
            </p>
          ) : (
            <ScrollableCategoryTabs
              tabs={tabCategories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              textAlign={settings.textAlign}
            />
          )
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center min-h-[220px] py-10" aria-busy="true">
            <CircularLoader size={36} />
          </div>
        ) : settings.showCategoryTabs && tabCategories.length === 0 ? null : visibleProducts.length === 0 ? (
          <p className={`${emptyAlignClass} text-gray-400 text-sm py-8`}>
            {settings.showCategoryTabs
              ? `No products in "${tabCategories[activeTab]?.label}" yet. Assign products in Admin.`
              : "No products yet. Add products in Admin."}
          </p>
        ) : (
          <ProductGrid
            items={gridItems}
            limit={settings.productsCount}
            columns={settings.productsPerRow}
          />
        )}

        {showViewAll ? (
          <EcomSectionViewAllButton
            label={settings.buttonLabel}
            buttonHref={settings.buttonHref}
            onDefaultButtonClick={exploreShop}
            textAlign={settings.textAlign}
          />
        ) : null}
      </div>
    </section>
  );
}

function EcomProductsTabsBlock({
  sectionId,
  title,
  subtitle,
  contentMap,
}: {
  sectionId: string;
  title: string;
  subtitle: string;
  contentMap?: Record<string, Record<string, string>>;
}) {
  const initialCachedProducts = readCachedProducts();
  const initialCachedCategories = readCachedCategories();
  const [products, setProducts] = useState<Product[]>(initialCachedProducts);
  const [categories, setCategories] = useState<Category[]>(initialCachedCategories);
  const [loading, setLoading] = useState(initialCachedProducts.length === 0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => hydrateHomeCatalog(setProducts, setCategories, setLoading), []);

  const productCounts = useMemo(() => buildProductCountMap(products), [products]);
  const settings = useMemo(
    () => parseProductsTabsSectionSettings(sectionId, { title, subtitle }, contentMap),
    [sectionId, title, subtitle, contentMap]
  );
  const emptyAlignClass =
    settings.textAlign === "left"
      ? "text-left"
      : settings.textAlign === "right"
        ? "text-right"
        : "text-center";

  const scopedCategories = useMemo(() => {
    if (settings.categoryIds.length === 0) return categories;
    return categories.filter((c) => isCategoryInSelection(c, settings.categoryIds));
  }, [categories, settings.categoryIds]);

  const tabCategories = useMemo(
    () => buildTabCategories(scopedCategories, productCounts),
    [scopedCategories, productCounts]
  );

  useEffect(() => {
    if (activeTab >= tabCategories.length) setActiveTab(0);
  }, [tabCategories.length, activeTab]);

  const cardsLimit = settings.productsPerRow * settings.rows;

  const visibleProducts = useMemo(() => {
    if (!settings.showCategoryTabs) {
      const allowedIds = new Set(tabCategories.map((t) => t.id));
      const scoped =
        allowedIds.size === 0
          ? products
          : products.filter((p) => allowedIds.has(productCategoryId(p)));
      return scoped.slice(0, cardsLimit);
    }
    const tab = tabCategories[activeTab];
    if (!tab) return [];

    return products.filter((p) => productCategoryId(p) === tab.id).slice(0, cardsLimit);
  }, [products, tabCategories, activeTab, cardsLimit, settings.showCategoryTabs]);

  const gridItems = useMemo(
    () => visibleProducts.map(toSpProductCardItem),
    [visibleProducts]
  );

  const exploreShop = () => {
    if (settings.showCategoryTabs) {
      const tab = tabCategories[activeTab];
      navigateApp(shopCategoryPath(tab?.label));
      return;
    }
    // Tabs off but section scoped to categories → open that category on shop
    if (tabCategories.length >= 1) {
      navigateApp(shopCategoryPath(tabCategories[0].label));
      return;
    }
    navigateApp("/shop");
  };

  const showViewAll =
    settings.showHeaderButton && settings.buttonLabel.trim().length > 0;

  return (
    <section id={sectionId} className={`bg-white w-full my-[26px] ${spacing.section.gap}`}>
      <div className={ECOM_SECTION_INNER}>
        <EcomProductsSectionHeader
          title={settings.title}
          subtitle={settings.subtitle}
          textAlign={settings.textAlign}
        />

        {settings.showCategoryTabs ? (
          loading ? (
            <CategoryTabsSkeleton count={Math.min(8, tabCategories.length || 4)} />
          ) : tabCategories.length === 0 ? (
            <p className={`${emptyAlignClass} text-gray-400 text-sm py-8`}>
              Add categories in Admin ? Categories to show tabs here.
            </p>
          ) : (
            <ScrollableCategoryTabs
              tabs={tabCategories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              textAlign={settings.textAlign}
            />
          )
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center min-h-[220px] py-10" aria-busy="true">
            <CircularLoader size={36} />
          </div>
        ) : settings.showCategoryTabs && tabCategories.length === 0 ? null : visibleProducts.length === 0 ? (
          <p className={`${emptyAlignClass} text-gray-400 text-sm py-8`}>
            {settings.showCategoryTabs
              ? `No products in "${tabCategories[activeTab]?.label}" yet. Assign products to this category in Admin.`
              : "No products yet. Add products in Admin."}
          </p>
        ) : (
          <ProductGrid
            items={gridItems}
            limit={cardsLimit}
            columns={settings.productsPerRow}
          />
        )}

        {showViewAll ? (
          <EcomSectionViewAllButton
            label={settings.buttonLabel}
            buttonHref={settings.buttonHref}
            onDefaultButtonClick={exploreShop}
            textAlign={settings.textAlign}
          />
        ) : null}
      </div>
    </section>
  );
}

export function EcomProductsWomenSection() {
  return (
    <EcomProductsTabsBlock
      sectionId="ecom-products-women"
      title="Women"
      subtitle="Design your look | find anywhere else"
    />
  );
}

export function EcomProductsWomenSectionWithContent({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
}) {
  return (
    <EcomProductsTabsBlock
      sectionId="ecom-products-women"
      title="Women"
      subtitle="Design your look | find anywhere else"
      contentMap={contentMap}
    />
  );
}

export function EcomProductsMenSection() {
  return (
    <EcomProductsTabsBlock
      sectionId="ecom-products-men"
      title="Men"
      subtitle="Create your lifestyle | All in clothing movement"
    />
  );
}

export function EcomProductsMenSectionWithContent({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
}) {
  return (
    <EcomProductsTabsBlock
      sectionId="ecom-products-men"
      title="Men"
      subtitle="Create your lifestyle | All in clothing movement"
      contentMap={contentMap}
    />
  );
}
export function EcomTrustBarSection({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
}) {
  return <EcomTrustBar contentMap={contentMap} asSection />;
}

export function EcomBrandPromoSection({
  sectionId = ECOM_BRAND_PROMO_SECTION_ID,
  contentMap,
  banner,
}: {
  sectionId?: string;
  contentMap?: Record<string, Record<string, string>>;
  banner?: BannerSlice;
}) {
  const settings = useMemo(
    () => parseEcomBrandPromoSettings(sectionId, contentMap),
    [sectionId, contentMap]
  );
  const embedSrc = useMemo(() => {
    const fromContent = youtubeEmbedSrc(settings.videoUrl);
    if (fromContent) return `${fromContent}?rel=0&modestbranding=1`;
    const fromBanner = youtubeEmbedSrc(banner?.targetUrl || "");
    return fromBanner ? `${fromBanner}?rel=0&modestbranding=1` : null;
  }, [settings.videoUrl, banner?.targetUrl]);
  const posterUrl = useMemo(() => {
    const fromContent = youtubeThumbnailUrl(settings.videoUrl);
    if (fromContent) return fromContent;
    return youtubeThumbnailUrl(banner?.targetUrl || "");
  }, [settings.videoUrl, banner?.targetUrl]);
  const directVideoUrl = useMemo(() => {
    const src = String(banner?.imageUrl || "");
    const v = src.toLowerCase();
    if (!src) return "";
    return v.endsWith(".mp4") || v.endsWith(".webm") || v.endsWith(".ogg") || v.includes("video/upload")
      ? src
      : "";
  }, [banner?.imageUrl]);

  const handleCta = () => {
    const href = (settings.buttonHref.trim() || banner?.targetUrl || "/shop").trim();
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin) {
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
      } catch {
        /* fall through */
      }
    }
    navigateApp(href);
  };

  const useFullBanner =
    settings.layout === "fullBanner" && Boolean(banner?.imageUrl) && !embedSrc && !directVideoUrl;

  if (useFullBanner) {
    const clickable = Boolean(
      (settings.buttonHref || banner?.targetUrl || "").trim()
    );
    return (
      <section
        id={sectionId}
        className={`bg-white w-full ${spacing.section.gap}`}
        style={{ marginTop: "26px", marginBottom: "26px" }}
      >
        <button
          type="button"
          onClick={clickable ? handleCta : undefined}
          disabled={!clickable}
          className={`block w-full p-0 border-0 bg-transparent ${
            clickable ? "cursor-pointer" : "cursor-default"
          }`}
          aria-label={settings.title || "Promotional banner"}
        >
          <img
            src={banner!.imageUrl}
            alt={settings.title || ""}
            className="ecom-hero-slide-img block w-full h-auto max-w-none"
          />
        </button>
      </section>
    );
  }

  return (
    <section
      id={sectionId}
      className={`bg-white w-full ${spacing.section.gap}`}
      style={{ marginTop: "26px", marginBottom: "26px" }}
    >
      <div className={`${ECOM_SECTION_INNER} grid md:grid-cols-2 gap-8 lg:gap-12 items-center`}>
        <div className="order-1">
          <Label className="text-[var(--theme-primary)] uppercase tracking-wide mb-2 block text-xs sm:text-sm">
            {settings.eyebrow}
          </Label>
          <h2 className={`${spText.h2} mb-4`}>{settings.title}</h2>
          <p className={`${spText.paragraph} mb-6 leading-relaxed`}>{settings.description}</p>
          <DynamicButton
            label={settings.buttonLabel}
            variant="filled"
            shape="pill"
            onClick={handleCta}
          />
        </div>

        <div
          className="order-2 relative w-full overflow-hidden rounded-xl bg-gray-200 shadow-sm"
          style={{ aspectRatio: "16 / 9" }}
        >
          {embedSrc ? (
            <>
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  aria-hidden
                />
              ) : null}
              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={embedSrc}
                title={settings.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </>
          ) : directVideoUrl ? (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={directVideoUrl}
              controls
              muted
              playsInline
            />
          ) : banner?.imageUrl ? (
            <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
              <Play className="w-14 h-14 text-white bg-black/40 rounded-full p-4" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function EcomBrandPromoSection2({
  contentMap,
  banner,
}: {
  contentMap?: Record<string, Record<string, string>>;
  banner?: BannerSlice;
}) {
  return (
    <EcomBrandPromoSection
      sectionId={ECOM_BRAND_PROMO_2_SECTION_ID}
      contentMap={contentMap}
      banner={banner}
    />
  );
}

export function EcomTestimonialSliderSection({
  containerClassName = ECOM_SECTION_INNER,
}: {
  containerClassName?: string;
} = {}) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    getPublicReviews()
      .then((data) => setReviews(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setReviews([]));
  }, []);

  const reviewerName = (review: PublicReview) => {
    if (review.userId && typeof review.userId === "object") {
      return review.userId.name?.trim() || "Anonymous";
    }
    return "Anonymous";
  };

  const reviewerInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "A";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  const reviewImage = (review: PublicReview) => {
    const product = review.productId;
    if (product && typeof product === "object" && product.image1) {
      const img = product.image1;
      if (img.startsWith("http") || img.startsWith("data:")) return img;
      return `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${
        img.startsWith("/") ? img : `/${img}`
      }`;
    }
    return "/product.png";
  };

  const items =
    reviews.length > 0
      ? reviews
      : ([1, 2, 3] as const).map((n) => ({
          _id: `placeholder-${n}`,
          rating: 5,
          comment: "Great quality and great price — highly recommend.",
          userId: { _id: String(n), name: "Customer" },
          productId: null,
        }));

  return (
    <section id="testimonials" className={`bg-white w-full ${spacing.section.gap}`}>
      <div className={containerClassName}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item) => {
            const isPlaceholder = String(item._id).startsWith("placeholder-");
            const review = item as PublicReview;
            const name = isPlaceholder ? "Customer" : reviewerName(review);
            const initials = reviewerInitials(name);
            const comment = (review.comment || "").trim() || "Great product!";
            const rating = Math.min(5, Math.max(1, Math.round(review.rating || 5)));
            const image = isPlaceholder ? "/product.png" : reviewImage(review);

            return (
              <article key={item._id} className="flex flex-col items-center text-center">
                <div className="relative w-full aspect-square overflow-hidden bg-gray-100 mb-0">
                  <img
                    src={image}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/product.png";
                    }}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-10">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-800 shadow-sm">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#1da1f2] flex items-center justify-center">
                        <BadgeCheck className="w-3 h-3 text-white" strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 px-2 w-full">
                  <h3 className="text-base font-bold text-gray-900 mb-2">{name}</h3>
                  <p className="text-sm text-gray-700 italic leading-relaxed mb-3 line-clamp-4">
                    &ldquo;{comment}&rdquo;
                  </p>
                  <div
                    className="flex justify-center gap-0.5 text-amber-400"
                    aria-label={`${rating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={16}
                        className={n <= rating ? "fill-current" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function EcomBlogFeedSection({
  containerClassName = ECOM_SECTION_INNER,
}: {
  containerClassName?: string;
} = {}) {
  type BlogRelation = string | { _id?: string; name?: string };
  type BlogPost = {
    _id: string;
    title?: string;
    description?: string;
    image?: string;
    createdAt?: string;
    views?: number;
    category?: BlogRelation;
    niche?: BlogRelation;
  };
  const [posts, setPosts] = useState<BlogPost[]>([]);

  const getBlogRelationName = (value?: BlogRelation) => {
    if (!value) return "";
    return typeof value === "object" ? value.name || "" : "";
  };

  const getBlogCategoryLabel = (blog: BlogPost) =>
    getBlogRelationName(blog.category) || getBlogRelationName(blog.niche);

  useEffect(() => {
    getBlogs("published")
      .then((data) => setPosts(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setPosts([]));
  }, []);

  const getBlogImage = (blog: BlogPost) => {
    if (blog.image && blog.image.trim() !== "" && blog.image !== "/product.png") {
      return blog.image.startsWith("http")
        ? blog.image
        : `${import.meta.env.VITE_API_URL?.replace("/api", "")}${blog.image}`;
    }
    return "/product.png";
  };

  const formatBlogDate = (value?: string) => {
    if (!value) return "12 Jan 2026";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "12 Jan 2026";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const placeholders = [1, 2, 3];

  return (
    <section id="ecom-blog-feed" className={`bg-white w-full ${spacing.section.gap}`}>
      <div className={containerClassName}>
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10">
          Our blog posts
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 my-6">
          {(posts.length ? posts : placeholders).map((item, i) => {
            const isPlaceholder = typeof item === "number";
            const post = isPlaceholder ? null : item;

            return (
              <BlogCard
                key={isPlaceholder ? `ph-${i}` : post!._id}
                id={isPlaceholder ? `placeholder-${i}` : post!._id}
                title={isPlaceholder ? "Blog post title here" : post?.title || "Untitled"}
                description={
                  isPlaceholder
                    ? "A short preview of the article appears here so visitors can skim before opening the full post."
                    : post?.description
                }
                image={isPlaceholder ? "/product.png" : getBlogImage(post!)}
                date={isPlaceholder ? "12 Jan 2026" : formatBlogDate(post?.createdAt)}
                niche={isPlaceholder ? "Category" : getBlogCategoryLabel(post!) || undefined}
                views={isPlaceholder ? 0 : post?.views}
                to={isPlaceholder ? "#" : `/blog/${post!._id}`}
                forceStyle="2"
                index={i}
              />
            );
          })}
        </div>

        <div className="mt-8 sm:mt-10 flex justify-center">
          <Link
            style={{textDecoration: "underline"}}
            to="/blogs"
            onClick={(e) => {
              e.preventDefault();
              navigateApp("/blogs");
            }}
            className="inline-flex items-center justify-center min-w-[140px] px-8 py-3 bg-black text-white text-sm font-bold tracking-wide uppercase hover:bg-gray-900 transition-colors"
          >
            VIEW ALL
          </Link>
        </div>
      </div>
    </section>
  );
}

export function EcomReviewsSupportSection({
  reviewPreset,
  contentMap,
}: {
  reviewPreset?: WriteReviewPreset;
  contentMap?: Record<string, Record<string, string>>;
}) {
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [whatsappHref, setWhatsappHref] = useState("https://wa.me/");
  const [reviewsRatingLabel, setReviewsRatingLabel] = useState<string>("—");
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const settings = useMemo(() => parseEcomReviewsSupportSettings(contentMap), [contentMap]);

  const loadReviewStats = useCallback(async () => {
    try {
      const reviews = await getPublicReviews();
      const list = Array.isArray(reviews) ? reviews : [];
      const count = list.length;
      if (count === 0) {
        setReviewsAvg(0);
        setReviewsRatingLabel("0/5 (0)");
        return;
      }
      const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      const avg = sum / count;
      setReviewsAvg(avg);
      setReviewsRatingLabel(`${avg.toFixed(1)}/5 (${count.toLocaleString()})`);
    } catch {
      setReviewsAvg(0);
      setReviewsRatingLabel("0/5 (0)");
    }
  }, []);

  useEffect(() => {
    void loadReviewStats();
  }, [loadReviewStats]);

  useEffect(() => {
    const company = getCachedData<{ phone?: string; paymentSettings?: { whatsappNumber?: string } }>(
      CACHE_KEYS.COMPANY
    );
    const phone = company?.paymentSettings?.whatsappNumber || company?.phone || "";
    if (phone) setWhatsappHref(buildWhatsAppUrl(phone, "Hello, I need support"));
  }, []);

  const openWhatsApp = () => {
    if (whatsappHref && whatsappHref !== "https://wa.me/") {
      window.open(whatsappHref, "_blank", "noopener,noreferrer");
    }
  };

  const scrollToReviews = () => {
    navigate("/reviews");
  };

  const handleReviewOpenChange = (open: boolean) => {
    setReviewOpen(open);
    // Refresh counts after closing write-review dialog (new review may have been added)
    if (!open) void loadReviewStats();
  };

  return (
    <section id="ecom-reviews-support" className={`w-full bg-[#fff5eb] ${spacing.section.gap}`}>
      <div className={`${ECOM_SECTION_INNER} grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-2xl bg-[#ebebeb] border border-gray-200/70 p-4 sm:p-5">
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Star className="w-7 h-7 text-amber-400 fill-amber-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={spText.h3}>{settings.reviewsTitle}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                      n <= Math.round(reviewsAvg) ? "fill-current" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <Label className="text-gray-500 font-normal">{reviewsRatingLabel}</Label>
            </div>
          </div>
          <div className="hidden w-px h-14 bg-gray-300 shrink-0" aria-hidden />
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <DynamicButton
              label={settings.reviewsViewButtonLabel}
              variant="transparent"
              shape="rounded"
              onClick={scrollToReviews}
              className="w-full sm:w-auto text-sm font-semibold whitespace-nowrap"
            />
            <DynamicButton
              label={settings.reviewsButtonLabel}
              variant="filled"
              shape="rounded"
              onClick={() => setReviewOpen(true)}
              className="w-full sm:w-auto text-sm font-semibold whitespace-nowrap"
            />
          </div>
        </div>

        <WriteReviewDialog open={reviewOpen} onOpenChange={handleReviewOpenChange} preset={reviewPreset} showAllProducts />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 rounded-2xl bg-[#ebebeb] border border-gray-200/70 p-4 sm:p-5">
          <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-sm">
              <User className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
            </div>
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={spText.h3}>{settings.supportTitle}</h3>
            <p className={`${spText.paragraph} mt-1.5`}>{settings.supportMembers}</p>
          </div>
          <div className="hidden w-px h-14 bg-gray-300 shrink-0" aria-hidden />
          <DynamicButton
            label={settings.supportButtonLabel}
            variant="filled"
            shape="rounded"
            onClick={openWhatsApp}
            className="shrink-0 w-full sm:w-auto text-sm font-semibold whitespace-nowrap"
          />
        </div>
      </div>
    </section>
  );
}
