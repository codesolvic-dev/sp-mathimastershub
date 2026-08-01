export type LandingSectionPage = "secondary" | "tertiary";

export type LandingLayoutVariant = "folio" | "ecom";

/** Full-width inner padding for Landing 3 eCom sections */
export const ECOM_SECTION_INNER = "w-full px-4 sm:px-6 lg:px-10 xl:px-14";

/** Products per row in Women/Men tab sections (SP Item Card grid → lg: 5 cols) */
export const ECOM_PRODUCTS_PER_ROW = 5;

export const DEFAULT_TERTIARY_LANDING_SECTION_ORDER = [
  "hero",
  "ecom-categories-round",
  "ecom-category-hero",
  "ecom-categories-tabs",
  "ecom-products-women",
  "ecom-products-men",
  "ecom-trust-bar",
  "ecom-brand-promo",
  "ecom-brand-promo-2",
  "ecom-reels",
  "testimonials",
  "ecom-blog-feed",
  "ecom-reviews-support",
  "contact",
  "faqs",
  "help-banner-1",
  "cta-banner-2",
  "text-image",
  "how-we-work",
];
