/**
 * Meta (Facebook) Pixel helpers — browser-only.
 * Uses Meta’s official base-code pattern so Pixel Helper can detect the pixel.
 */

import {
  isMetaPixelEventEnabled,
  normalizeMetaPixelEvents,
  type MetaPixelEventKey,
  type MetaPixelEvents,
} from "@/utils/metaPixelEvents";

export type MetaPixelContent = {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  status?: boolean | string;
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
};

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: (...args: unknown[]) => void;
    };
    _fbq?: unknown;
    __spMetaPixelId?: string;
    __spMetaPixelReady?: boolean;
    __spMetaPixelEvents?: MetaPixelEvents;
  }
}

const DIGITS = /^\d+$/;
const FB_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";

export function isValidMetaPixelId(id: string): boolean {
  const cleaned = String(id || "").trim();
  return DIGITS.test(cleaned) && cleaned.length >= 5;
}

export function setMetaPixelEventsConfig(events?: Partial<MetaPixelEvents> | null): void {
  if (typeof window === "undefined") return;
  window.__spMetaPixelEvents = normalizeMetaPixelEvents(events);
}

function eventAllowed(key: MetaPixelEventKey): boolean {
  return isMetaPixelEventEnabled(window.__spMetaPixelEvents, key);
}

function ensureNoscriptPixel(pixelId: string): void {
  const id = `sp-meta-pixel-img-${pixelId}`;
  if (document.getElementById(id)) return;
  const img = document.createElement("img");
  img.id = id;
  img.height = 1;
  img.width = 1;
  img.alt = "";
  img.style.display = "none";
  img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;
  document.body.appendChild(img);
}

/** Install Meta’s official fbq stub + fbevents.js (Pixel Helper detects this). */
export function loadMetaPixel(pixelId: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const id = String(pixelId || "").trim();
  if (!isValidMetaPixelId(id)) return false;

  if (window.__spMetaPixelId === id && window.__spMetaPixelReady && window.fbq) {
    ensureNoscriptPixel(id);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = window as any;
  const b = document;
  if (!f.fbq) {
    const n: any = (f.fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
  }

  const existing = b.querySelector(`script[src="${FB_SCRIPT_SRC}"]`);
  if (!existing) {
    const t = b.createElement("script");
    t.async = true;
    t.src = FB_SCRIPT_SRC;
    t.setAttribute("data-sp-meta-pixel", id);
    const s = b.getElementsByTagName("script")[0];
    if (s?.parentNode) s.parentNode.insertBefore(t, s);
    else b.head.appendChild(t);
  }

  f.fbq("init", id);
  window.__spMetaPixelId = id;
  window.__spMetaPixelReady = true;
  ensureNoscriptPixel(id);
  return true;
}

export function trackMeta(
  event: string,
  params?: MetaPixelContent,
  opts?: { custom?: boolean; eventKey?: MetaPixelEventKey }
): void {
  if (typeof window === "undefined" || !window.fbq || !window.__spMetaPixelReady) return;
  if (opts?.eventKey && !eventAllowed(opts.eventKey)) return;
  try {
    if (opts?.custom) {
      window.fbq("trackCustom", event, params || {});
    } else {
      window.fbq("track", event, params || {});
    }
  } catch {
    /* ignore tracking errors */
  }
}

export const metaPixel = {
  pageView: () => trackMeta("PageView", undefined, { eventKey: "pageView" }),

  productView: (p: {
    id: string;
    name?: string;
    price?: number;
    currency?: string;
    category?: string;
  }) =>
    trackMeta(
      "ViewContent",
      {
        content_ids: [String(p.id)],
        content_name: p.name,
        content_type: "product",
        content_category: p.category,
        value: p.price,
        currency: p.currency,
      },
      { eventKey: "productView" }
    ),

  categoryView: (p: { id?: string; name: string }) =>
    // Use standard ViewContent (product_group) — Pixel Helper detects this reliably
    // (custom "ViewCategory" often looks like missing / not counted the same way)
    trackMeta(
      "ViewContent",
      {
        content_name: p.name,
        content_category: p.name,
        content_ids: p.id ? [String(p.id)] : undefined,
        content_type: "product_group",
      },
      { eventKey: "categoryView" }
    ),

  search: (searchString: string, currency?: string) =>
    trackMeta(
      "Search",
      {
        search_string: searchString,
        currency,
      },
      { eventKey: "search" }
    ),

  addToCart: (p: {
    id: string;
    name?: string;
    price?: number;
    quantity?: number;
    currency?: string;
  }) =>
    trackMeta(
      "AddToCart",
      {
        content_ids: [String(p.id)],
        content_name: p.name,
        content_type: "product",
        value: p.price != null ? Number(p.price) * (p.quantity || 1) : undefined,
        currency: p.currency,
        contents: [
          {
            id: String(p.id),
            quantity: p.quantity || 1,
            item_price: p.price,
          },
        ],
      },
      { eventKey: "addToCart" }
    ),

  removeFromCart: (p: {
    id: string;
    name?: string;
    price?: number;
    quantity?: number;
    currency?: string;
  }) =>
    trackMeta(
      "RemoveFromCart",
      {
        content_ids: [String(p.id)],
        content_name: p.name,
        content_type: "product",
        value: p.price != null ? Number(p.price) * (p.quantity || 1) : undefined,
        currency: p.currency,
      },
      { custom: true, eventKey: "removeFromCart" }
    ),

  wishlist: (p: {
    id: string;
    name?: string;
    price?: number;
    currency?: string;
  }) =>
    trackMeta(
      "AddToWishlist",
      {
        content_ids: [String(p.id)],
        content_name: p.name,
        content_type: "product",
        value: p.price,
        currency: p.currency,
      },
      { eventKey: "wishlist" }
    ),

  beginCheckout: (p: {
    value: number;
    currency?: string;
    numItems?: number;
    contentIds?: string[];
  }) =>
    trackMeta(
      "InitiateCheckout",
      {
        value: p.value,
        currency: p.currency,
        num_items: p.numItems,
        content_ids: p.contentIds,
        content_type: "product",
      },
      { eventKey: "beginCheckout" }
    ),

  addPaymentInfo: (p: { value?: number; currency?: string; paymentMethod?: string }) =>
    trackMeta(
      "AddPaymentInfo",
      {
        value: p.value,
        currency: p.currency,
        content_category: p.paymentMethod,
      },
      { eventKey: "addPaymentInfo" }
    ),

  purchase: (p: {
    value: number;
    currency?: string;
    orderId?: string;
    contentIds?: string[];
    numItems?: number;
    contents?: MetaPixelContent["contents"];
  }) =>
    trackMeta(
      "Purchase",
      {
        value: p.value,
        currency: p.currency,
        content_ids: p.contentIds,
        content_type: "product",
        num_items: p.numItems,
        contents: p.contents,
        ...(p.orderId ? { content_name: p.orderId } : {}),
      },
      { eventKey: "purchase" }
    ),

  refund: (p: { value: number; currency?: string; orderId?: string }) =>
    trackMeta(
      "Refund",
      {
        value: p.value,
        currency: p.currency,
        content_name: p.orderId,
      },
      { custom: true, eventKey: "refund" }
    ),

  signUp: (method?: string) =>
    trackMeta(
      "CompleteRegistration",
      {
        content_name: method || "email",
        status: true,
      },
      { eventKey: "signUp" }
    ),

  login: (method?: string) =>
    trackMeta(
      "Login",
      {
        content_name: method || "email",
      },
      { custom: true, eventKey: "login" }
    ),

  buttonClick: (p?: { label?: string; href?: string }) =>
    trackMeta(
      "ButtonClick",
      {
        content_name: p?.label || "button",
        content_category: p?.href,
      },
      { custom: true, eventKey: "buttonClick" }
    ),

  scroll: (percent: number) =>
    trackMeta(
      "Scroll",
      {
        content_name: `${percent}%`,
        value: percent,
      },
      { custom: true, eventKey: "scroll" }
    ),

  mouseIn: (p?: { label?: string }) =>
    trackMeta(
      "MouseIn",
      {
        content_name: p?.label || "element",
      },
      { custom: true, eventKey: "mouseIn" }
    ),

  mouseOut: (p?: { label?: string }) =>
    trackMeta(
      "MouseOut",
      {
        content_name: p?.label || "element",
      },
      { custom: true, eventKey: "mouseOut" }
    ),
};
