/** Sp eCom — product detail page widgets (below product info) */

export interface EcomProductDetailSectionDef {
  sectionId: string;
  label: string;
  subInfo: string;
  order: number;
  defaultEnabled: boolean;
  alwaysInBuilder: boolean;
}

export const SP_ECOM_PRODUCT_DETAIL_SECTIONS: EcomProductDetailSectionDef[] = [
  {
    sectionId: "ecom-trust-bar",
    label: "Trust Icons Bar",
    subInfo: "Shipping, exchange, COD, support",
    order: 0,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-similar-products",
    label: "Similar Products",
    subInfo: "Related products carousel",
    order: 1,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-blog-feed",
    label: "Blog / Instagram Feed",
    subInfo: "Latest posts or social grid",
    order: 2,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-reviews-support",
    label: "Reviews & Support",
    subInfo: "Write a review + WhatsApp support",
    order: 3,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
];

export const SP_ECOM_PRODUCT_ALWAYS_IN_BUILDER_IDS = new Set(
  SP_ECOM_PRODUCT_DETAIL_SECTIONS.filter((s) => s.alwaysInBuilder).map((s) => s.sectionId)
);

export const SP_ECOM_PRODUCT_DEFAULT_ENABLED_IDS = new Set(
  SP_ECOM_PRODUCT_DETAIL_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.sectionId)
);

export const SP_ECOM_PRODUCT_SECTION_SUB_INFO: Record<string, string> = Object.fromEntries(
  SP_ECOM_PRODUCT_DETAIL_SECTIONS.map((s) => [s.sectionId, s.subInfo])
);

export const SP_ECOM_PRODUCT_DETAIL_DEFAULT_ORDER = SP_ECOM_PRODUCT_DETAIL_SECTIONS.map(
  (s) => s.sectionId
);
