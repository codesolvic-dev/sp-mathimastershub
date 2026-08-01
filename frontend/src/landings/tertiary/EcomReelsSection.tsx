import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Play,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { getProducts } from "@/api/product.api";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/utils/cache";
import { applyProductDiscount } from "@/utils/productDiscount";
import { youtubeEmbedSrc, youtubeThumbnailUrl } from "@/utils/youtubeEmbed";
import {
  ECOM_REELS_SECTION_ID,
  parseEcomReelsSettings,
} from "./ecomReels";

type Product = {
  _id: string;
  name: string;
  image1?: string;
  video1?: string;
  video2?: string;
  price?: number;
  discount?: number;
  status?: string;
  createdAt?: string;
};

type ReelItem = {
  id: string;
  name: string;
  href: string;
  image: string;
  videoUrl: string;
  poster: string;
  priceLabel: string;
  playable: { type: "iframe" | "video"; baseSrc: string };
};

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());
}

function resolvePlayable(url?: string): { type: "iframe" | "video"; baseSrc: string } | null {
  const raw = String(url || "").trim();
  if (!raw) return null;
  const yt = youtubeEmbedSrc(raw);
  if (yt) return { type: "iframe", baseSrc: yt };
  if (isDirectVideoUrl(raw) || raw.includes("video/upload")) {
    return { type: "video", baseSrc: raw };
  }
  return null;
}

function posterFor(videoUrl: string): string {
  // Always prefer video frame / YouTube thumb — never product image thumbnails
  const yt = youtubeThumbnailUrl(videoUrl);
  if (yt) return yt;
  return "";
}

function iframeSrc(base: string, muted: boolean) {
  const clean = String(base || "")
    .trim()
    .replace("https://www.youtube.com/embed/", "https://www.youtube-nocookie.com/embed/")
    .replace("http://www.youtube.com/embed/", "https://www.youtube-nocookie.com/embed/");
  const idMatch = clean.match(/\/embed\/([^/?&]+)/);
  const videoId = idMatch?.[1] || "";
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    fs: "0",
    disablekb: "1",
    iv_load_policy: "3",
    cc_load_policy: "0",
  });
  if (videoId) {
    params.set("loop", "1");
    params.set("playlist", videoId);
  }
  return `${clean.split("?")[0]}?${params.toString()}`;
}

function readCachedProducts(): Product[] {
  const cached = getCachedData<Product[]>(CACHE_KEYS.PRODUCTS);
  return Array.isArray(cached) ? cached : [];
}

/** Infinite strip — one-by-one slides, center taller via GPU scale only (no layout thrash). */
const LOOX_REELS_CSS = `
.ecom-loox-reels {
  background: #ffffff;
  overflow-x: hidden;
}
.ecom-loox-reels .reel-strip {
  display: flex;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding: 40px 0 44px;
  gap: var(--reel-gap, 14px);
  will-change: scroll-position;
}
.ecom-loox-reels .reel-strip.is-animating {
  scroll-snap-type: none;
  pointer-events: none;
}
.ecom-loox-reels .reel-strip::-webkit-scrollbar { display: none; }
.ecom-loox-reels .reel-item {
  flex: 0 0 var(--reel-card-w, 18%);
  width: var(--reel-card-w, 18%);
  max-width: var(--reel-card-w, 18%);
  box-sizing: border-box;
  scroll-snap-align: center;
}
.ecom-loox-reels .reel-card {
  position: relative;
  width: 100%;
  padding-bottom: 165%;
  border-radius: 16px;
  overflow: hidden;
  background: #ddd;
  box-shadow: 0 6px 18px rgba(0,0,0,0.14);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transform: scale(0.88);
  transform-origin: center center;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
  will-change: transform;
  backface-visibility: hidden;
}
.ecom-loox-reels .reel-item.is-near .reel-card {
  transform: scale(0.95);
}
.ecom-loox-reels .reel-item.is-center .reel-card {
  transform: scale(1.08);
  box-shadow: 0 14px 32px rgba(0,0,0,0.22);
  z-index: 2;
}
.ecom-loox-reels .reel-card-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 0;
  pointer-events: none;
}
.ecom-loox-reels .reel-card-media.iframe {
  object-fit: unset;
  width: 125%;
  height: 125%;
  left: -12.5%;
  top: -12.5%;
  right: auto;
  bottom: auto;
}
.ecom-loox-reels .reel-yt-mask {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 96px;
  height: 60px;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(to top left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
}
.ecom-loox-reels .reel-media-cover {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.ecom-loox-reels .reel-fade {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.28) 26%, transparent 50%);
  pointer-events: none;
}
.ecom-loox-reels .reel-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 2.5px solid rgba(255,255,255,0.95);
  background: rgba(255,255,255,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  pointer-events: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.22);
}
.ecom-loox-reels .reel-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  padding: 12px 14px 14px;
  pointer-events: none;
}
.ecom-loox-reels .reel-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.ecom-loox-reels .reel-meta-name {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 22px);
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
}
.ecom-loox-reels .reel-verified {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ecom-loox-reels .reel-stars {
  display: flex;
  gap: 2px;
  color: #f5b400;
}
.ecom-loox-reels .nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 30;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #222;
  cursor: pointer;
}
.ecom-loox-reels .nav-btn:hover { background: #fafafa; }
.ecom-loox-reels .nav-prev { left: 0; }
.ecom-loox-reels .nav-next { right: 0; }
@media (max-width: 640px) {
  .ecom-loox-reels .nav-btn { width: 34px; height: 34px; }
  .ecom-loox-reels .reel-play { width: 44px; height: 44px; }
  .ecom-loox-reels .reel-meta-name { font-size: 13px; }
  .ecom-loox-reels .reel-card { padding-bottom: 155%; border-radius: 14px; }
  .ecom-loox-reels .reel-item.is-center .reel-card { transform: scale(1.06); }
}
`;

function ReelModalFace({
  reel,
  muted,
  liked,
  onMuteToggle,
  onLikeToggle,
}: {
  reel: ReelItem;
  muted: boolean;
  liked: boolean;
  onMuteToggle: () => void;
  onLikeToggle: () => void;
}) {
  return (
    <div className="absolute inset-0">
      {reel.playable.type === "iframe" ? (
        <iframe
          key={`${reel.id}-${muted ? "m" : "u"}`}
          title={reel.name}
          src={iframeSrc(reel.playable.baseSrc, muted)}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          key={reel.id}
          src={reel.playable.baseSrc}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          loop
          muted={muted}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white border border-white/20"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white border border-white/20"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <Heart
            className="w-4 h-4"
            style={liked ? { fill: "var(--theme-primary)", color: "var(--theme-primary)" } : undefined}
          />
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-2">
        <div className="flex items-center gap-2.5 rounded-lg border border-white/25 bg-black/55 px-2.5 h-12 backdrop-blur-sm">
          <img src={reel.image} alt="" className="h-9 w-9 rounded object-cover shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{reel.name}</p>
            {reel.priceLabel ? (
              <p className="text-[11px] text-white/80 truncate">{reel.priceLabel}</p>
            ) : null}
          </div>
        </div>
        <Link
          to={reel.href}
          onClick={(e) => e.stopPropagation()}
          className="block w-full text-center text-xs font-semibold tracking-[0.14em] uppercase h-10 leading-10 rounded-sm"
          style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-light, #fff)" }}
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
}

const ITEM_GAP = 14;
const VISIBLE_DESKTOP = 5;
/** One-by-one auto advance delay (ms) */
const AUTO_SLIDE_MS = 10000;
const SLIDE_DURATION_MS = 520;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function animateScrollLeft(
  el: HTMLElement,
  to: number,
  durationMs: number,
  onFrame?: () => void
): Promise<void> {
  const from = el.scrollLeft;
  const delta = to - from;
  if (Math.abs(delta) < 0.5) {
    el.scrollLeft = to;
    return Promise.resolve();
  }
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      el.scrollLeft = from + delta * easeOutCubic(p);
      onFrame?.();
      if (p < 1) requestAnimationFrame(tick);
      else {
        el.scrollLeft = to;
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export function EcomReelsSection({
  contentMap,
}: {
  contentMap?: Record<string, Record<string, string>>;
} = {}) {
  const { formatMoney } = useStoreCurrency();
  const settings = useMemo(
    () => parseEcomReelsSettings(contentMap, ECOM_REELS_SECTION_ID),
    [contentMap]
  );
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts());
  const [loading, setLoading] = useState(() => readCachedProducts().length === 0);
  const [centerKey, setCenterKey] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [cardWidthPx, setCardWidthPx] = useState(180);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const touchingRef = useRef(false);
  const animatingRef = useRef(false);
  const manualPauseUntilRef = useRef(0);
  const loopWidthRef = useRef(0);
  const scrollStepRef = useRef(194);
  const modalOpenRef = useRef(false);
  const settleTimerRef = useRef(0);
  const centerKeyRef = useRef<string | null>(null);

  const title = settings.title.trim();

  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  useEffect(() => {
    let cancelled = false;
    getProducts({ activeOnly: true })
      .then((list) => {
        if (cancelled) return;
        const rows = (Array.isArray(list) ? list : []).filter(
          (p: Product) => String(p.status || "active").toLowerCase() !== "inactive"
        );
        setProducts(rows);
        setCachedData(CACHE_KEYS.PRODUCTS, rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reels = useMemo(() => {
    const byId = new Map(products.map((p) => [p._id, p]));
    const ordered: Product[] = [];

    if (settings.productIds.length > 0) {
      // Builder selection order (same order as picked / saved)
      for (const id of settings.productIds) {
        const hit = byId.get(id);
        if (hit) ordered.push(hit);
      }
    } else {
      // Same order products were added (oldest → newest)
      const withVideo = products.filter(
        (p) => (p.video1 || "").trim() || (p.video2 || "").trim()
      );
      withVideo.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (ta !== tb) return ta - tb;
        return String(a._id).localeCompare(String(b._id));
      });
      ordered.push(...withVideo);
    }

    const items: ReelItem[] = [];
    for (const p of ordered) {
      const primary = settings.preferVideo2
        ? p.video2 || p.video1
        : p.video1 || p.video2;
      const url = String(primary || "").trim();
      const playable = resolvePlayable(url);
      if (!playable) continue;
      const price = Number(p.price) || 0;
      const discounted = applyProductDiscount(price, p.discount);
      items.push({
        id: p._id,
        name: p.name,
        href: `/product/${p._id}`,
        image: String(p.image1 || "").trim() || "/product.png",
        videoUrl: url,
        poster: posterFor(url),
        priceLabel: price > 0 ? formatMoney(discounted) : "",
        playable,
      });
    }
    return items;
  }, [products, settings.productIds, settings.preferVideo2, formatMoney]);

  const enableLoop = reels.length > 1;

  /** Duplicate set for seamless infinite strip (same as categories). */
  const stripItems = useMemo(() => {
    if (reels.length === 0) return [] as { reel: ReelItem; originalIndex: number; key: string }[];
    if (!enableLoop) {
      return reels.map((reel, originalIndex) => ({
        reel,
        originalIndex,
        key: reel.id,
      }));
    }
    const out: { reel: ReelItem; originalIndex: number; key: string }[] = [];
    for (let copy = 0; copy < 2; copy++) {
      reels.forEach((reel, originalIndex) => {
        out.push({
          reel,
          originalIndex,
          key: `${reel.id}__${copy}`,
        });
      });
    }
    return out;
  }, [reels, enableLoop]);

  const measureCardWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const visible =
      el.clientWidth < 480 ? 2.2 : el.clientWidth < 640 ? 3.2 : el.clientWidth < 768 ? 4 : VISIBLE_DESKTOP;
    const w = Math.max(110, (el.clientWidth - ITEM_GAP * (visible - 1)) / visible);
    setCardWidthPx(w);
    scrollStepRef.current = w + ITEM_GAP;
  }, []);

  const readLoopMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el || reels.length === 0) return null;

    const nodes = el.querySelectorAll("[data-reel-item]");
    if (nodes.length === 0) return null;

    const first = nodes[0] as HTMLElement;
    const second = nodes[1] as HTMLElement | undefined;
    const step =
      second != null ? second.offsetLeft - first.offsetLeft : first.offsetWidth + ITEM_GAP;
    scrollStepRef.current = step > 0 ? step : first.offsetWidth + ITEM_GAP;

    if (!enableLoop) {
      loopWidthRef.current = 0;
      return { loopWidth: 0, step: scrollStepRef.current };
    }

    if (nodes.length < reels.length + 1) return null;
    const secondSetFirst = nodes[reels.length] as HTMLElement;
    const loopWidth = secondSetFirst.offsetLeft - first.offsetLeft;
    if (loopWidth <= 0) return null;

    loopWidthRef.current = loopWidth;
    return { loopWidth, step: scrollStepRef.current };
  }, [reels.length, enableLoop]);

  const normalizeInfiniteScroll = useCallback(() => {
    if (!enableLoop) return;
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
  }, [enableLoop]);

  const syncCenterFromScroll = useCallback((opts?: { playMedia?: boolean }) => {
    const el = scrollRef.current;
    const allowPlay = opts?.playMedia !== false;

    if (!el || modalOpenRef.current) {
      centerKeyRef.current = null;
      setCenterKey((prev) => (prev == null ? prev : null));
      return;
    }

    const nodes = Array.from(el.querySelectorAll("[data-reel-item]")) as HTMLElement[];
    if (nodes.length === 0) return;

    const centerX = el.scrollLeft + el.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const mid = node.offsetLeft + node.offsetWidth / 2;
      const d = Math.abs(mid - centerX);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const bestKey = nodes[bestIdx]?.getAttribute("data-reel-key") || null;

    // Update spotlight classes immediately via DOM (no React lag mid-scroll)
    nodes.forEach((node, i) => {
      const isCenter = i === bestIdx;
      const isNear = i === bestIdx - 1 || i === bestIdx + 1;
      node.classList.toggle("is-center", isCenter);
      node.classList.toggle("is-near", isNear);
    });

    // Only commit React state (media play) when settled — avoids iframe remount jank
    if (!allowPlay || animatingRef.current) {
      return;
    }

    centerKeyRef.current = bestKey;
    setCenterKey((prev) => (prev === bestKey ? prev : bestKey));
  }, []);

  const pauseAutoScrollBriefly = useCallback(() => {
    manualPauseUntilRef.current = Date.now() + 4500;
  }, []);

  const scheduleSettleSync = useCallback(() => {
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      if (animatingRef.current) return;
      normalizeInfiniteScroll();
      syncCenterFromScroll({ playMedia: true });
    }, 140);
  }, [normalizeInfiniteScroll, syncCenterFromScroll]);

  const scrollByStep = useCallback(
    async (direction: -1 | 1, opts?: { fromAuto?: boolean }) => {
      const el = scrollRef.current;
      if (!el || reels.length === 0 || animatingRef.current) return;

      const metrics = readLoopMetrics();
      if (!metrics) return;
      const { loopWidth, step } = metrics;

      if (!opts?.fromAuto) pauseAutoScrollBriefly();

      // Pause media while sliding so YouTube iframe doesn't remount mid-animation
      setCenterKey(null);
      centerKeyRef.current = null;

      animatingRef.current = true;
      el.classList.add("is-animating");

      if (!enableLoop) {
        const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
        const next = Math.max(0, Math.min(el.scrollLeft + direction * step, maxScroll));
        await animateScrollLeft(el, next, SLIDE_DURATION_MS, () =>
          syncCenterFromScroll({ playMedia: false })
        );
        animatingRef.current = false;
        el.classList.remove("is-animating");
        syncCenterFromScroll({ playMedia: true });
        return;
      }

      normalizeInfiniteScroll();

      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      if (direction === 1 && el.scrollLeft + step > maxScroll + 1) {
        el.scrollLeft -= loopWidth;
      } else if (direction === -1 && el.scrollLeft - step < 0) {
        el.scrollLeft += loopWidth;
      }

      const target = el.scrollLeft + direction * step;
      await animateScrollLeft(el, target, SLIDE_DURATION_MS, () =>
        syncCenterFromScroll({ playMedia: false })
      );

      normalizeInfiniteScroll();
      animatingRef.current = false;
      el.classList.remove("is-animating");
      syncCenterFromScroll({ playMedia: true });
    },
    [
      reels.length,
      enableLoop,
      pauseAutoScrollBriefly,
      readLoopMetrics,
      normalizeInfiniteScroll,
      syncCenterFromScroll,
    ]
  );

  useEffect(() => {
    const sync = () => {
      measureCardWidth();
      readLoopMetrics();
      normalizeInfiniteScroll();
      syncCenterFromScroll({ playMedia: true });
    };

    const timers = [60, 300, 800].map((ms) => window.setTimeout(sync, ms));
    const el = scrollRef.current;

    const onScroll = () => {
      if (animatingRef.current) return;
      // During free drag/swipe: update scale classes only, debounce media
      syncCenterFromScroll({ playMedia: false });
      scheduleSettleSync();
    };

    if (el) el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sync);

    let ro: ResizeObserver | null = null;
    if (sectionRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => sync());
      ro.observe(sectionRef.current);
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(settleTimerRef.current);
      if (el) el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, [
    stripItems.length,
    measureCardWidth,
    readLoopMetrics,
    normalizeInfiniteScroll,
    syncCenterFromScroll,
    scheduleSettleSync,
  ]);

  // One-by-one auto slide (infinite loop)
  useEffect(() => {
    if (!enableLoop || loading || reels.length <= 1) return;

    const id = window.setInterval(() => {
      if (
        modalOpenRef.current ||
        pausedRef.current ||
        touchingRef.current ||
        animatingRef.current ||
        Date.now() < manualPauseUntilRef.current
      ) {
        return;
      }
      void scrollByStep(1, { fromAuto: true });
    }, AUTO_SLIDE_MS);

    return () => window.clearInterval(id);
  }, [enableLoop, loading, reels.length, stripItems.length, scrollByStep]);

  useEffect(() => {
    if (!modalOpen) {
      syncCenterFromScroll({ playMedia: true });
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setCenterKey(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
      if (e.key === "ArrowLeft") setModalIndex((i) => (i - 1 + reels.length) % reels.length);
      if (e.key === "ArrowRight") setModalIndex((i) => (i + 1) % reels.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      syncCenterFromScroll({ playMedia: true });
    };
  }, [modalOpen, reels.length, syncCenterFromScroll]);

  const openModal = (originalIndex: number) => {
    const safe = ((originalIndex % reels.length) + reels.length) % reels.length;
    setModalIndex(safe);
    setMuted(true);
    setModalOpen(true);
  };

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!loading && reels.length === 0) {
    return null;
  }

  const count = reels.length;
  const activeModalReel = reels[modalIndex] ?? null;
  const playing = !modalOpen && centerKey;

  return (
    <section
      id={ECOM_REELS_SECTION_ID}
      ref={sectionRef}
      className="ecom-loox-reels w-full py-8 sm:py-10"
      style={{ marginBottom: 26 }}
    >
      <style>{LOOX_REELS_CSS}</style>
        
      <div className="w-full max-w-[1280px] mx-auto relative px-9 sm:px-11">
        {title ? (
          <h2
            className="text-center text-lg sm:text-2xl font-bold tracking-[0.12em] uppercase mb-6"
            style={{ color: "var(--theme-dark, #1a1a1a)" }}
          >
            {title}
          </h2>
        ) : null}

        <div className="relative w-full">
          {settings.showArrows && count > 1 ? (
            <>
              <button
                type="button"
                className="nav-btn nav-prev"
                aria-label="Previous reel"
                onClick={() => scrollByStep(-1)}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                className="nav-btn nav-next"
                aria-label="Next reel"
                onClick={() => scrollByStep(1)}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </>
          ) : null}

          {loading && reels.length === 0 ? (
            <div className="flex gap-3 overflow-hidden py-4 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[18%] rounded-2xl bg-gray-200 animate-pulse"
                  style={{ paddingBottom: "36%" }}
                />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="reel-strip"
              style={
                {
                  "--reel-gap": `${ITEM_GAP}px`,
                  "--reel-card-w": `${cardWidthPx}px`,
                } as React.CSSProperties
              }
              onMouseEnter={() => {
                pausedRef.current = true;
              }}
              onMouseLeave={() => {
                pausedRef.current = false;
              }}
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
              {stripItems.map((slide, i) => {
                const { reel, originalIndex } = slide;
                const shouldPlay = playing === slide.key;
                const playable = reel.playable;
                return (
                  <div
                    key={slide.key}
                    data-reel-item
                    data-reel-key={slide.key}
                    className="reel-item"
                  >
                    <div
                      className="reel-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => openModal(originalIndex)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal(originalIndex);
                        }
                      }}
                      aria-label={`Play reel: ${reel.name}`}
                    >
                      {playable.type === "video" ? (
                        <video
                          className="reel-card-media"
                          src={playable.baseSrc}
                          autoPlay={shouldPlay}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          poster={reel.poster || undefined}
                        />
                      ) : shouldPlay ? (
                        <>
                          <iframe
                            className="reel-card-media iframe"
                            src={iframeSrc(playable.baseSrc, true)}
                            title={reel.name}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            tabIndex={-1}
                          />
                          <div className="reel-media-cover" aria-hidden />
                          <div className="reel-yt-mask" aria-hidden />
                        </>
                      ) : (
                        <img
                          className="reel-card-media"
                          src={reel.poster || youtubeThumbnailUrl(reel.videoUrl) || ""}
                          alt={reel.name}
                          loading={i < 5 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      )}
                      <div className="reel-fade" />
                      {!shouldPlay ? (
                        <span className="reel-play" aria-hidden>
                          <Play className="w-[18px] h-[18px] fill-white ml-0.5" />
                        </span>
                      ) : null}
                      <div className="reel-meta">
                        <div className="reel-meta-row">
                          <span className="reel-meta-name">{reel.name}</span>
                          <span className="reel-verified" aria-hidden>
                            <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                          </span>
                        </div>
                        <div className="reel-stars" aria-label="5 star rating">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star key={s} className="w-3 h-3 fill-current text-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalOpen && activeModalReel ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Product reel"
          onClick={() => setModalOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-30 p-2 text-white/90 hover:text-white"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>

          {reels.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 sm:left-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white border border-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalIndex((i) => (i - 1 + reels.length) % reels.length);
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 sm:right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white border border-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalIndex((i) => (i + 1) % reels.length);
                }}
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : null}

          <div
            className="relative w-[min(320px,86vw)] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ReelModalFace
              reel={activeModalReel}
              muted={muted}
              liked={likedIds.has(activeModalReel.id)}
              onMuteToggle={() => setMuted((m) => !m)}
              onLikeToggle={() => toggleLike(activeModalReel.id)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
