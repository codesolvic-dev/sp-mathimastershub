/** Landing 3 (Sp eCom) home page sections — matches storefront mockup */

export interface EcomSectionDef {
  sectionId: string;
  label: string;
  subInfo: string;
  order: number;
  defaultEnabled: boolean;
  /** Always listed in SpBuilder sidebar (even when toggled off) */
  alwaysInBuilder: boolean;
}

export const SP_ECOM_HOME_SECTIONS: EcomSectionDef[] = [
  {
    sectionId: "hero",
    label: "Hero Banner",
    subInfo: "Full-width hero with shop CTA",
    order: 0,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-categories-round",
    label: "Rounded Categories",
    subInfo: "Circular category row — shop by concern",
    order: 1,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-category-hero",
    label: "Category Hero",
    subInfo: "Large category tile + two side tiles — images & View Items from Edit",
    order: 1.75,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-categories-tabs",
    label: "Shop by Category (Tabs)",
    subInfo: "All category names + products grid — row/column from Edit",
    order: 2,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-products-women",
    label: "Products with Tabs (Women)",
    subInfo: "Women catalog with category tabs",
    order: 3,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-products-men",
    label: "Products with Tabs (Men)",
    subInfo: "Men catalog with category tabs",
    order: 4,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-trust-bar",
    label: "Trust Icons Bar",
    subInfo: "Shipping, exchange, COD, support",
    order: 5,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-brand-promo",
    label: "Brand Promotional",
    subInfo: "Full-width banner image (or text + media)",
    order: 6,
    defaultEnabled: false,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-brand-promo-2",
    label: "Brand Promotional 2",
    subInfo: "Second full-width banner image (or text + media)",
    order: 6.5,
    defaultEnabled: false,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-reels",
    label: "Product Reels",
    subInfo: "Horizontal video reels from product Video 1 / Video 2 — place after sales banner",
    order: 6.75,
    // Off by default so it appears under "Add Sections from Third Landing"
    defaultEnabled: false,
    alwaysInBuilder: false,
  },
  {
    sectionId: "testimonials",
    label: "Testimonial Slider",
    subInfo: "Customer reviews carousel",
    order: 7,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-blog-feed",
    label: "Blog / Instagram Feed",
    subInfo: "Latest posts or social grid",
    order: 8,
    defaultEnabled: false,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-reviews-support",
    label: "Reviews & Support",
    subInfo: "Write a review + WhatsApp support",
    order: 9,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
];

export const SP_ECOM_HOME_SECTION_IDS = new Set(
  SP_ECOM_HOME_SECTIONS.map((s) => s.sectionId)
);

export const SP_ECOM_ALWAYS_IN_BUILDER_IDS = new Set(
  SP_ECOM_HOME_SECTIONS.filter((s) => s.alwaysInBuilder).map((s) => s.sectionId)
);

export const SP_ECOM_DEFAULT_ENABLED_IDS = new Set(
  SP_ECOM_HOME_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.sectionId)
);

export const SP_ECOM_SECTION_SUB_INFO: Record<string, string> = Object.fromEntries(
  SP_ECOM_HOME_SECTIONS.map((s) => [s.sectionId, s.subInfo])
);

/** Seeds for backend — home sections first, then optional extras for Add Section modal */
export const SP_ECOM_BACKEND_SEEDS = [
  ...SP_ECOM_HOME_SECTIONS.map(({ sectionId, label, order }) => ({
    sectionId,
    label,
    order,
  })),
  { sectionId: "contact", label: "Contact", order: 20 },
  { sectionId: "faqs", label: "FAQs", order: 21 },
  { sectionId: "help-banner-1", label: "Help Banner 1", order: 22 },
  { sectionId: "cta-banner-2", label: "CTA Banner 2", order: 23 },
  { sectionId: "text-image", label: "Text + Image", order: 24 },
  { sectionId: "how-we-work", label: "How We Work", order: 25 },
];
