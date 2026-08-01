export type SpEcomSubPageSlug = "home" | "shop" | "about" | "contact" | "product-detail";

export interface SpEcomSubPage {
  slug: SpEcomSubPageSlug;
  title: string;
  subInfo: string;
  publicPath: string;
  /** Section builder available (Landing 3 home only for now) */
  hasBuilder: boolean;
}

export const SP_ECOM_SUB_PAGES: SpEcomSubPage[] = [
  {
    slug: "home",
    title: "Home",
    subInfo: "Hero, categories, products, testimonials & more",
    publicPath: "/",
    hasBuilder: true,
  },
  {
    slug: "shop",
    title: "Shop",
    subInfo: "Full product catalog with filters",
    publicPath: "/shop",
    hasBuilder: false,
  },
  {
    slug: "product-detail",
    title: "Product Details",
    subInfo: "Trust bar, similar products, blog, reviews & support",
    publicPath: "/product/:id",
    hasBuilder: true,
  },
  {
    slug: "about",
    title: "About",
    subInfo: "About us page — hero & how we work",
    publicPath: "/about-us",
    hasBuilder: true,
  },
  {
    slug: "contact",
    title: "Contact Us",
    subInfo: "Contact form and details",
    publicPath: "/contact-us",
    hasBuilder: false,
  },
];

export function getSpEcomSubPage(slug?: string): SpEcomSubPage | undefined {
  return SP_ECOM_SUB_PAGES.find((p) => p.slug === slug);
}

export function getEcomBuilderLandingPage(
  slug?: string
): "tertiary" | "tertiary-product" | "tertiary-about" {
  if (slug === "product-detail") return "tertiary-product";
  if (slug === "about") return "tertiary-about";
  return "tertiary";
}
