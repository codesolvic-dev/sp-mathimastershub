import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { spacing } from "@/utils/spacing";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { isCategoryInSelection } from "@/utils/landingSectionContent";
import {
  fetchCategoriesShared,
  resolveCategoryImageUrl,
  type CategoryRecord,
} from "@/utils/categoryFetch";
import { ECOM_SECTION_INNER } from "./constants";
import {
  ECOM_CATEGORY_HERO_SECTION_ID,
  parseEcomCategoryHeroSettings,
} from "./ecomCategoryHero";
import { metaPixel } from "@/utils/metaPixel";

type Category = CategoryRecord;

function readCachedCategories(): Category[] {
  const cached = getCachedData<Category[]>(CACHE_KEYS.CATEGORIES);
  return Array.isArray(cached) ? cached : [];
}

function resolveCategoriesByIds(all: Category[], ids: string[]): Category[] {
  if (!ids.length) return [];
  const byId = new Map(all.map((c) => [c._id, c]));
  const byName = new Map(all.map((c) => [c.name.trim().toLowerCase(), c]));
  const out: Category[] = [];
  for (const raw of ids) {
    const id = String(raw || "").trim();
    if (!id) continue;
    const hit =
      byId.get(id) ||
      byName.get(id.toLowerCase()) ||
      all.find((c) => isCategoryInSelection(c, [id]));
    if (hit && !out.some((c) => c._id === hit._id)) out.push(hit);
  }
  return out;
}

function TileImage({
  src,
  alt,
  name,
  priority = false,
}: {
  src?: string;
  alt: string;
  name: string;
  priority?: boolean;
}) {
  const imageSrc = resolveCategoryImageUrl(src);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(() =>
    imageSrc ? "loading" : "error"
  );

  useEffect(() => {
    if (!imageSrc) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setStatus("loaded");
    };
    probe.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    probe.src = imageSrc;
    if (probe.complete && probe.naturalWidth > 0) {
      setStatus("loaded");
    }
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  if (!imageSrc || status === "error") {
    const initial = (name?.charAt(0) || "?").toUpperCase();
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
        <span className="text-5xl font-semibold text-white/40">{initial}</span>
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse" aria-hidden />
      )}
      <img
        src={imageSrc}
        alt={alt}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
}

function CategoryTile({
  title,
  imageUrl,
  href,
  buttonLabel,
  size,
  priority = false,
  categoryId,
}: {
  title: string;
  imageUrl?: string;
  href: string;
  buttonLabel: string;
  size: "main" | "side";
  priority?: boolean;
  categoryId?: string;
}) {
  const titleClass =
    size === "main"
      ? "text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
      : "text-lg sm:text-xl font-bold text-white leading-tight";

  return (
    <Link
      to={href}
      onClick={() => {
        if (href.includes("category=")) {
          metaPixel.categoryView({ id: categoryId, name: title });
        }
      }}
      className="group relative block w-full h-full min-h-0 overflow-hidden rounded-2xl bg-gray-800"
    >
      <TileImage src={imageUrl} alt={title} name={title} priority={priority} />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6 flex flex-col items-start gap-2 sm:gap-3 z-10">
        <h3 className={titleClass}>{title}</h3>
        <span
          className={`inline-flex items-center rounded-md bg-black/45 text-white border border-white/20 backdrop-blur-sm group-hover:bg-black/60 transition-colors ${
            size === "main" ? "px-3.5 py-2 text-sm font-medium" : "px-3 py-1.5 text-xs font-medium"
          }`}
        >
          {buttonLabel}
        </span>
      </div>
    </Link>
  );
}

export function EcomCategoryHeroSection({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
} = {}) {
  const settings = useMemo(
    () => parseEcomCategoryHeroSettings(contentMap, ECOM_CATEGORY_HERO_SECTION_ID),
    [contentMap]
  );

  const [categories, setCategories] = useState<Category[]>(() => readCachedCategories());
  const [loading, setLoading] = useState(() => readCachedCategories().length === 0);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCategoriesShared({ preferCache: true, preloadImages: true })
      .then((list) => {
        if (cancelled) return;
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mainSlides = useMemo(() => {
    const picked = resolveCategoriesByIds(categories, settings.mainCategoryIds);
    const list = picked.length ? picked : categories.slice(0, 3);
    // Slider off → single static tile (first category only)
    if (!settings.sliderEnabled) return list.slice(0, 1);
    return list;
  }, [categories, settings.mainCategoryIds, settings.sliderEnabled]);

  const sideTiles = useMemo(() => {
    const picked = resolveCategoriesByIds(categories, settings.sideCategoryIds).slice(0, 2);
    if (picked.length >= 2) return picked;
    const exclude = new Set(mainSlides.map((c) => c._id));
    const fallback = categories.filter((c) => !exclude.has(c._id));
    const merged = [...picked];
    for (const c of fallback) {
      if (merged.length >= 2) break;
      if (!merged.some((m) => m._id === c._id)) merged.push(c);
    }
    while (merged.length < 2 && mainSlides[merged.length]) {
      merged.push(mainSlides[merged.length]);
    }
    return merged.slice(0, 2);
  }, [categories, settings.sideCategoryIds, mainSlides]);

  const mainSlideKey = `${settings.sliderEnabled ? "slide" : "static"}:${mainSlides.map((c) => c._id).join(",")}`;

  useEffect(() => {
    setSlideIndex(0);
  }, [mainSlideKey]);

  useEffect(() => {
    if (!settings.sliderEnabled || !settings.autoplay || mainSlides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % mainSlides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [settings.sliderEnabled, settings.autoplay, mainSlides.length]);

  if (loading && categories.length === 0) {
    return (
      <section id={ECOM_CATEGORY_HERO_SECTION_ID} className={`bg-white w-full ${spacing.section.gap}`}>
        <div className={ECOM_SECTION_INNER}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-[420px] lg:min-h-[520px]">
            <div className="lg:col-span-7 rounded-2xl bg-gray-200 animate-pulse min-h-[280px]" />
            <div className="lg:col-span-5 grid grid-rows-2 gap-3 sm:gap-4 min-h-[280px]">
              <div className="rounded-2xl bg-gray-200 animate-pulse" />
              <div className="rounded-2xl bg-gray-200 animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const placeholderCat = (label: string, i: number): Category => ({
    _id: `placeholder-${i}`,
    name: label,
    icon: "",
  });

  const effectiveMain =
    mainSlides.length > 0
      ? mainSlides
      : settings.sliderEnabled
        ? [placeholderCat("Category", 0), placeholderCat("Category", 1)]
        : [placeholderCat("Category", 0)];
  const effectiveSides =
    sideTiles.length > 0
      ? sideTiles
      : [placeholderCat("Category", 2), placeholderCat("Category", 3)];

  const current = effectiveMain[Math.min(slideIndex, Math.max(0, effectiveMain.length - 1))];
  const mainTitle = settings.mainTitle.trim() || current?.name || "Category";
  const mainImage = settings.mainImageUrl || current?.icon || "";
  const isPlaceholder = String(current?._id || "").startsWith("placeholder-");
  const mainHref = !current || isPlaceholder
    ? "/shop"
    : `/shop?category=${encodeURIComponent(current.name)}`;

  const sliderActive = settings.sliderEnabled && effectiveMain.length > 1;

  const go = (dir: -1 | 1) => {
    if (!sliderActive) return;
    setSlideIndex((i) => (i + dir + effectiveMain.length) % effectiveMain.length);
  };

  return (
    <section id={ECOM_CATEGORY_HERO_SECTION_ID} className={`bg-white w-full ${spacing.section.gap}`}>
      <div className={ECOM_SECTION_INNER}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:min-h-[520px]">
          <div className="relative lg:col-span-7 min-h-[280px] sm:min-h-[360px] lg:min-h-[520px]">
            {current ? (
              <CategoryTile
                title={mainTitle}
                imageUrl={mainImage}
                href={mainHref}
                buttonLabel={settings.buttonLabel}
                size="main"
                priority
                categoryId={isPlaceholder ? undefined : current?._id}
              />
            ) : (
              <div className="h-full rounded-2xl bg-gray-100" />
            )}

            {sliderActive && settings.showArrows ? (
              <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-black/50 text-white border border-white/20 hover:bg-black/70 transition-colors"
                  aria-label="Previous category"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    go(1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-black/50 text-white border border-white/20 hover:bg-black/70 transition-colors"
                  aria-label="Next category"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 grid grid-rows-2 gap-3 sm:gap-4 min-h-[280px] lg:min-h-[520px]">
            {[0, 1].map((i) => {
              const cat = effectiveSides[i];
              const titleOverride = i === 0 ? settings.side1Title : settings.side2Title;
              const imageOverride = i === 0 ? settings.side1ImageUrl : settings.side2ImageUrl;
              if (!cat) {
                return <div key={i} className="rounded-2xl bg-gray-100 min-h-[130px]" />;
              }
              const sideIsPlaceholder = String(cat._id).startsWith("placeholder-");
              return (
                <div key={`${cat._id}-${i}`} className="min-h-[130px] sm:min-h-[160px]">
                  <CategoryTile
                    title={titleOverride.trim() || cat.name}
                    imageUrl={imageOverride || cat.icon}
                    href={
                      sideIsPlaceholder
                        ? "/shop"
                        : `/shop?category=${encodeURIComponent(cat.name)}`
                    }
                    buttonLabel={settings.buttonLabel}
                    size="side"
                    priority
                    categoryId={sideIsPlaceholder ? undefined : cat._id}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
