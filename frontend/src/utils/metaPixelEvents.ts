/**
 * Meta Pixel event keys — toggled from Developer → Third-Party Services.
 */

export const META_PIXEL_EVENT_KEYS = [
  "pageView",
  "productView",
  "categoryView",
  "search",
  "addToCart",
  "removeFromCart",
  "wishlist",
  "beginCheckout",
  "addPaymentInfo",
  "purchase",
  "refund",
  "signUp",
  "login",
  /** Home / landing engagement */
  "buttonClick",
  "scroll",
  "mouseIn",
  "mouseOut",
] as const;

export type MetaPixelEventKey = (typeof META_PIXEL_EVENT_KEYS)[number];

export type MetaPixelEvents = Record<MetaPixelEventKey, boolean>;

/** New engagement keys default OFF when missing from a saved config (don't surprise users). */
export const META_PIXEL_ENGAGEMENT_KEYS: MetaPixelEventKey[] = [
  "buttonClick",
  "scroll",
  "mouseIn",
  "mouseOut",
];

export const META_PIXEL_EVENT_ROWS: Array<{
  key: MetaPixelEventKey;
  label: string;
  metaName: string;
  description: string;
}> = [
  { key: "pageView", label: "Page View", metaName: "PageView", description: "Every storefront page load / route change" },
  { key: "productView", label: "Product View", metaName: "ViewContent", description: "Product detail page" },
  { key: "categoryView", label: "Category View", metaName: "ViewContent (product_group)", description: "Shop filtered by category / category click" },
  { key: "search", label: "Search", metaName: "Search", description: "Product search on shop" },
  { key: "addToCart", label: "Add to Cart", metaName: "AddToCart", description: "Item added to cart" },
  { key: "removeFromCart", label: "Remove from Cart", metaName: "RemoveFromCart", description: "Item removed from cart" },
  { key: "wishlist", label: "Wishlist", metaName: "AddToWishlist", description: "Product added to wishlist" },
  { key: "beginCheckout", label: "Begin Checkout", metaName: "InitiateCheckout", description: "Checkout started" },
  { key: "addPaymentInfo", label: "Add Payment Info", metaName: "AddPaymentInfo", description: "Payment method selected" },
  { key: "purchase", label: "Purchase", metaName: "Purchase", description: "Order completed" },
  { key: "refund", label: "Refund", metaName: "Refund", description: "Optional — when refund is recorded" },
  { key: "signUp", label: "Sign Up", metaName: "CompleteRegistration", description: "New account registered" },
  { key: "login", label: "Login", metaName: "Login", description: "User logged in" },
  { key: "buttonClick", label: "Button Click", metaName: "ButtonClick", description: "Home page: buttons / CTAs clicked" },
  { key: "scroll", label: "Scroll", metaName: "Scroll", description: "Home page: scroll depth 25% / 50% / 75% / 100%" },
  { key: "mouseIn", label: "Mouse In", metaName: "MouseIn", description: "Home page: mouse enters buttons / links / cards" },
  { key: "mouseOut", label: "Mouse Out", metaName: "MouseOut", description: "Home page: mouse leaves buttons / links / cards" },
];

export function defaultMetaPixelEvents(allOn = true): MetaPixelEvents {
  return META_PIXEL_EVENT_KEYS.reduce((acc, key) => {
    if (META_PIXEL_ENGAGEMENT_KEYS.includes(key)) {
      // Select all → on; Clear all → off; fresh default → on for engagement too when allOn
      acc[key] = allOn;
    } else {
      acc[key] = allOn;
    }
    return acc;
  }, {} as MetaPixelEvents);
}

export function normalizeMetaPixelEvents(raw?: Partial<MetaPixelEvents> | null): MetaPixelEvents {
  const hasSaved = Boolean(raw && typeof raw === "object" && Object.keys(raw).length > 0);
  const base = defaultMetaPixelEvents(true);
  if (!hasSaved) return base;

  for (const key of META_PIXEL_EVENT_KEYS) {
    if (typeof raw![key] === "boolean") {
      base[key] = raw![key]!;
    } else if (META_PIXEL_ENGAGEMENT_KEYS.includes(key)) {
      // Existing installs that never saw these keys — leave off until enabled in table
      base[key] = false;
    }
  }
  return base;
}

export function isMetaPixelEventEnabled(
  events: Partial<MetaPixelEvents> | null | undefined,
  key: MetaPixelEventKey
): boolean {
  if (!events || typeof events !== "object") return true;
  return events[key] !== false;
}
