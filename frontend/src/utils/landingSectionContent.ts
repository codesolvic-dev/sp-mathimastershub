/**
 * SpFolio editable copy + SecondLanding overrides. Keys are flat strings stored in DB `contentJson`.
 */

export type SectionEditFieldDef = {
  key: string;
  label: string;
  multiline?: boolean;
  gridColumns?: boolean;
  number?: boolean;
  /** Multi-select category checklist (stores comma-separated category IDs). */
  categoryChecklist?: boolean;
  /** Optional helper text under category checklist header. */
  categoryChecklistHint?: string;
  /** Multi-select product checklist (stores comma-separated product IDs). */
  productChecklist?: boolean;
  /** Optional helper text under product checklist. */
  productChecklistHint?: string;
  /** When true, product checklist only lists products that have videos. */
  productChecklistVideosOnly?: boolean;
  /** Fixed dropdown options (stores selected value). */
  selectOptions?: { value: string; label: string }[];
  /** Yes/no toggle switch (stores "yes" | "no"). */
  toggle?: boolean;
  /** Left / center / right align button group (stores "left" | "center" | "right"). */
  textAlign?: boolean;
};

/** Parse yes/no content flags. Empty = defaultOn. */
export function isContentFlagEnabled(raw: string | undefined | null, defaultOn = true): boolean {
  const v = String(raw ?? "").trim().toLowerCase();
  if (!v) return defaultOn;
  if (["no", "false", "0", "off", "hidden"].includes(v)) return false;
  if (["yes", "true", "1", "on", "show"].includes(v)) return true;
  return defaultOn;
}

/** Parse stored category selection (comma-separated IDs). */
export function parseCategorySelectionCsv(raw: string): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function packCategorySelectionCsv(ids: string[]): string {
  return ids.filter(Boolean).join(",");
}

/** Match category by stored ID or legacy name (case-insensitive). */
export function isCategoryInSelection(
  cat: { _id: string; name: string },
  selected: string[]
): boolean {
  if (selected.length === 0) return true;
  const set = new Set(selected.map((s) => s.toLowerCase()));
  return set.has(cat._id.toLowerCase()) || set.has(cat.name.trim().toLowerCase());
}

/** Field groups per static sectionId (not catalog / not custom-*). */
export const SECTION_EDIT_FIELD_DEFS: Record<string, SectionEditFieldDef[]> = {
  about: [
    { key: "sectionTitle", label: "Section heading (on page)" },
    { key: "sectionSubtitle", label: "Section subtitle" },
    { key: "title", label: "Main title" },
    { key: "tagline", label: "Tagline" },
  ],
  "cta-banner-1": [
    { key: "title", label: "Banner title" },
    { key: "description", label: "Description", multiline: true },
    { key: "buttonText", label: "Button text" },
  ],
  "cta-banner-2": [
    { key: "title", label: "Banner title" },
    { key: "description", label: "Description", multiline: true },
    { key: "buttonText", label: "Button text" },
    { key: "buttonHref", label: "Button link (e.g. /shop)" },
  ],
  "cta-banner-3": [
    { key: "title", label: "Banner title" },
    { key: "description", label: "Description", multiline: true },
    { key: "buttonText", label: "Button text" },
    { key: "buttonHref", label: "Button link (e.g. /shop)" },
  ],
  "cta-banner-4": [
    { key: "title", label: "Banner title" },
    { key: "description", label: "Description", multiline: true },
    { key: "buttonText", label: "Button text" },
  ],
  "text-image": [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", multiline: true },
    { key: "bullets", label: "Bullet lines (one per line)", multiline: true },
  ],
  "how-we-work": [
    { key: "title", label: "Title" },
    { key: "subtitle", label: "Subtitle" },
  ],
  "help-banner-1": [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", multiline: true },
  ],
  "help-banner-2": [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", multiline: true },
    { key: "buttonText", label: "Button text" },
  ],
  "coming-soon": [
    { key: "title", label: "Title" },
    { key: "tagline", label: "Tagline", multiline: true },
  ],
  "other-pages": [
    { key: "sectionTitle", label: "Section heading" },
    { key: "sectionSubtitle", label: "Section subtitle" },
    { key: "title", label: "Article title" },
    { key: "author", label: "Author" },
    { key: "date", label: "Date line" },
  ],
  clients: [
    { key: "title", label: "Section title" },
    { key: "description", label: "Section description", multiline: true },
    {
      key: "logoSlides",
      label:
        "Logo slides — one line per logo (URL or URL|Alt). Blank line starts a new slide row.",
      multiline: true,
    },
  ],
  excellence: [
    { key: "heading", label: "Full heading (e.g. Building Excellence Since 1995)" },
    { key: "headingUnderline", label: "Part of heading with underline (e.g. Building Excellence)" },
    { key: "paragraph1", label: "First paragraph", multiline: true },
    { key: "paragraph2", label: "Second paragraph", multiline: true },
    {
      key: "statsLines",
      label: "Stat cards — one per line as Value|Label (e.g. 25+|Years Experience)",
      multiline: true,
    },
  ],
  "scale-operations": [
    { key: "tag", label: "Small tag above heading" },
    { key: "heading", label: "Main heading" },
    { key: "description", label: "Description", multiline: true },
    { key: "features", label: "Feature bullets (one line each)", multiline: true },
    { key: "primaryButtonText", label: "Primary button text" },
    { key: "primaryButtonHref", label: "Primary button link (URL or #anchor)" },
    { key: "secondaryButtonText", label: "Secondary button text" },
    { key: "secondaryButtonHref", label: "Secondary button link" },
    { key: "trustText", label: "Trust line under buttons" },
    { key: "ratingText", label: "Rating / reviews line (e.g. 4.9/5 (2,300+ reviews))" },
  ],
  team: [
    { key: "title", label: "Section title" },
    { key: "subtitle", label: "Section subtitle" },
  ],
  "zi-core-package": [
    { key: "sectionTitle", label: "Optional section heading above columns (leave empty to hide)" },
    { key: "sectionSubtitle", label: "Section subtitle (when heading is shown)" },
    { key: "headingBefore", label: "Main title — text before accent (e.g. \"A Global \")" },
    { key: "headingAccent", label: "Main title — accent in theme color (e.g. \"Zi Core\")" },
    { key: "headingAfter", label: "Main title — text after accent" },
    { key: "description", label: "Description", multiline: true },
    { key: "youtubeUrl", label: "YouTube URL for embedded video (watch or youtu.be or embed)" },
    { key: "getStartedLabel", label: "Primary button label" },
    { key: "getStartedHref", label: "Primary button link (e.g. /zi-core-package)" },
    { key: "watchDemoLabel", label: "Secondary button label" },
    { key: "watchDemoUrl", label: "Secondary button URL (opens new tab — use YouTube watch link)" },
  ],
  hero: [
    { key: "slide1Title", label: "Slide 1 (Hero Main) — heading" },
    {
      key: "slide1ShowTitle",
      label: "Slide 1 — show heading",
      toggle: true,
    },
    { key: "slide1Subtitle", label: "Slide 1 (Hero Main) — subtitle", multiline: true },
    {
      key: "slide1ShowSubtitle",
      label: "Slide 1 — show subtitle / text",
      toggle: true,
    },
    { key: "slide1ButtonLabel", label: "Slide 1 — button label" },
    { key: "slide1ButtonHref", label: "Slide 1 — button link (e.g. /shop)" },
    {
      key: "slide1ShowButton",
      label: "Slide 1 — show button",
      toggle: true,
    },
    { key: "slide2Title", label: "Slide 2 (Hero Secondary) — heading" },
    {
      key: "slide2ShowTitle",
      label: "Slide 2 — show heading",
      toggle: true,
    },
    { key: "slide2Subtitle", label: "Slide 2 (Hero Secondary) — subtitle", multiline: true },
    {
      key: "slide2ShowSubtitle",
      label: "Slide 2 — show subtitle / text",
      toggle: true,
    },
    { key: "slide2ButtonLabel", label: "Slide 2 — button label" },
    { key: "slide2ButtonHref", label: "Slide 2 — button link (e.g. /shop)" },
    {
      key: "slide2ShowButton",
      label: "Slide 2 — show button",
      toggle: true,
    },
    { key: "slide3Title", label: "Slide 3 (Hero Tertiary) — heading" },
    {
      key: "slide3ShowTitle",
      label: "Slide 3 — show heading",
      toggle: true,
    },
    { key: "slide3Subtitle", label: "Slide 3 (Hero Tertiary) — subtitle", multiline: true },
    {
      key: "slide3ShowSubtitle",
      label: "Slide 3 — show subtitle / text",
      toggle: true,
    },
    { key: "slide3ButtonLabel", label: "Slide 3 — button label" },
    { key: "slide3ButtonHref", label: "Slide 3 — button link (e.g. /shop)" },
    {
      key: "slide3ShowButton",
      label: "Slide 3 — show button",
      toggle: true,
    },
  ],
  "ecom-trust-bar": [
    {
      key: "items",
      label:
        "Trust bar items — one per line: icon|Title|Description. Icons: flag, package, banknote, headset, truck, box",
      multiline: true,
    },
  ],
  "ecom-categories-round": [
    {
      key: "scrollMode",
      label: "Category scroll behavior",
      selectOptions: [
        { value: "auto", label: "Auto scroll (continuous)" },
        { value: "arrows", label: "Scroll with arrows only" },
      ],
    },
  ],
  "ecom-categories-tabs": [
    { key: "title", label: "Section title" },
    { key: "subtitle", label: "Section subtitle" },
    { key: "textAlign", label: "Text alignment", textAlign: true },
    {
      key: "showCategoryTabs",
      label: "Category tabs",
      toggle: true,
    },
    {
      key: "showHeaderButton",
      label: "Header button",
      selectOptions: [
        { value: "no", label: "No button" },
        { value: "yes", label: "Show button" },
      ],
    },
    { key: "buttonLabel", label: "Button label (when button is shown)" },
    { key: "buttonHref", label: "Button link (optional — e.g. /shop)" },
    { key: "productsPerRow", label: "Products per row", gridColumns: true },
    { key: "productsCount", label: "Products per category (max 24)", number: true },
  ],
  "ecom-category-hero": [
    { key: "buttonLabel", label: "View Items button label" },
    {
      key: "sliderEnabled",
      label: "Main tile slider",
      toggle: true,
    },
    {
      key: "mainCategories",
      label: "Main / left tile categories",
      categoryChecklist: true,
      categoryChecklistHint:
        "Slider ON: multiple categories rotate on the left tile. Slider OFF: only the first checked category shows (static). Images come from each category icon.",
    },
    {
      key: "sideCategories",
      label: "Side tiles (right column — first 2 checked)",
      categoryChecklist: true,
      categoryChecklistHint: "Pick 2 categories for the stacked right tiles (with images).",
    },
    { key: "showArrows", label: "Slider arrows (when slider is on)", toggle: true },
    { key: "autoplay", label: "Slider autoplay (when slider is on)", toggle: true },
    { key: "mainTitle", label: "Main title override (optional)" },
    { key: "side1Title", label: "Top side title override (optional)" },
    { key: "side2Title", label: "Bottom side title override (optional)" },
    { key: "mainImageUrl", label: "Main image URL override (optional)" },
    { key: "side1ImageUrl", label: "Top side image URL override (optional)" },
    { key: "side2ImageUrl", label: "Bottom side image URL override (optional)" },
  ],
  "ecom-products-women": [
    { key: "title", label: "Section title" },
    { key: "subtitle", label: "Section subtitle" },
    { key: "textAlign", label: "Text alignment", textAlign: true },
    {
      key: "showCategoryTabs",
      label: "Category tabs",
      toggle: true,
    },
    {
      key: "showHeaderButton",
      label: "Header button",
      selectOptions: [
        { value: "no", label: "No button" },
        { value: "yes", label: "Show button" },
      ],
    },
    { key: "buttonLabel", label: "Button label (when button is shown)" },
    { key: "buttonHref", label: "Button link (optional — e.g. /shop)" },
    {
      key: "categories",
      label: "Categories to show (check the ones you want)",
      categoryChecklist: true,
    },
    { key: "productsPerRow", label: "Cards per row", gridColumns: true },
    { key: "rows", label: "Rows (1 or 2)", number: true },
  ],
  "ecom-products-men": [
    { key: "title", label: "Section title" },
    { key: "subtitle", label: "Section subtitle" },
    { key: "textAlign", label: "Text alignment", textAlign: true },
    {
      key: "showCategoryTabs",
      label: "Category tabs",
      toggle: true,
    },
    {
      key: "showHeaderButton",
      label: "Header button",
      selectOptions: [
        { value: "no", label: "No button" },
        { value: "yes", label: "Show button" },
      ],
    },
    { key: "buttonLabel", label: "Button label (when button is shown)" },
    { key: "buttonHref", label: "Button link (optional — e.g. /shop)" },
    {
      key: "categories",
      label: "Categories to show (check the ones you want)",
      categoryChecklist: true,
    },
    { key: "productsPerRow", label: "Cards per row", gridColumns: true },
    { key: "rows", label: "Rows (1 or 2)", number: true },
  ],
  "ecom-brand-promo": [
    {
      key: "layout",
      label: "Layout",
      selectOptions: [
        { value: "fullBanner", label: "Full-width banner image" },
        { value: "split", label: "Text + media (two columns)" },
      ],
    },
    { key: "eyebrow", label: "Eyebrow label (split layout)" },
    { key: "title", label: "Heading (split layout)" },
    { key: "description", label: "Description (split layout)", multiline: true },
    { key: "buttonLabel", label: "Button label (split layout)" },
    { key: "buttonHref", label: "Button / banner link (e.g. /shop)" },
    { key: "videoUrl", label: "YouTube URL (split layout media)" },
  ],
  "ecom-brand-promo-2": [
    {
      key: "layout",
      label: "Layout",
      selectOptions: [
        { value: "fullBanner", label: "Full-width banner image" },
        { value: "split", label: "Text + media (two columns)" },
      ],
    },
    { key: "eyebrow", label: "Eyebrow label (split layout)" },
    { key: "title", label: "Heading (split layout)" },
    { key: "description", label: "Description (split layout)", multiline: true },
    { key: "buttonLabel", label: "Button label (split layout)" },
    { key: "buttonHref", label: "Button / banner link (e.g. /shop)" },
    { key: "videoUrl", label: "YouTube URL (split layout media)" },
  ],
  "ecom-reels": [
    { key: "title", label: "Section title (default: WATCH & BUY)" },
    {
      key: "products",
      label: "Products for reels",
      productChecklist: true,
      productChecklistVideosOnly: true,
      productChecklistHint:
        "Pick products that have Video 1 or Video 2 in Admin → Products. Order = carousel order. Leave empty to auto-include all products with videos.",
    },
    { key: "showArrows", label: "Carousel arrows", toggle: true },
    {
      key: "preferVideo2",
      label: "Prefer Video 2 over Video 1",
      toggle: true,
    },
  ],
  "ecom-reviews-support": [
    { key: "reviewsTitle", label: "Reviews card title" },
    { key: "reviewsRating", label: "Reviews rating text (e.g. 4.1/5 (1000+))" },
    { key: "reviewsButtonLabel", label: "Write review button label" },
    { key: "reviewsViewButtonLabel", label: "View reviews button label" },
    { key: "supportTitle", label: "Support card title" },
    { key: "supportMembers", label: "Support team names" },
    { key: "supportButtonLabel", label: "WhatsApp button label" },
  ],
  "ecom-about-hero": [
    { key: "title", label: "Main heading" },
    { key: "paragraphs", label: "Body paragraphs (one per line)", multiline: true },
    {
      key: "showStats",
      label: "Show count stats (15+, 500+, …)",
      toggle: true,
    },
    {
      key: "statsLines",
      label: "Stat cards — one per line as Value|Label (e.g. 15+|Years of Excellence)",
      multiline: true,
    },
  ],
  "ecom-about-process": [
    { key: "title", label: "Section title" },
    { key: "subtitle", label: "Section subtitle" },
    {
      key: "stepsLines",
      label: "Process steps — one per line as Title|Description",
      multiline: true,
    },
  ],
};

/** Default copy matching SecondLanding hardcoded strings (used when DB empty). */
export const SECTION_CONTENT_DEFAULTS: Record<string, Record<string, string>> = {
  about: {
    sectionTitle: "About me",
    sectionSubtitle: "FCPS – General Surgeon | Medical Photographer",
    title: "We Take Surgery Beyond the Operating Room",
    tagline: "User Role or Tag Line",
  },
  "cta-banner-1": {
    title: "Discover Surgical Precision & Art",
    description:
      "Explore the intersection of medicine and visual storytelling through curated surgical documentation and photography.",
    buttonText: "Explore Now",
  },
  "cta-banner-2": {
    title: "Products are listed...",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
    buttonText: "View Now",
    buttonHref: "/shop",
  },
  "cta-banner-3": {
    title: "Like what you see?",
    description: "Explore our full collection and discover products you'll love.",
    buttonText: "Shop Now",
    buttonHref: "/shop",
  },
  "cta-banner-4": {
    title: "Products are listed...",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
    buttonText: "Explore More",
  },
  "text-image": {
    title: "Precision Meets Art in Surgery",
    description:
      "As a board-certified surgeon and medical photographer, I capture the discipline, skill, and human side of surgery. Each procedure is documented to educate, inspire, and showcase the artistry involved in modern surgical practice.",
    bullets: "Board-Certified General Surgeon\nPassionate Photographer\nBridges Surgery and Storytellingt",
  },
  "how-we-work": {
    title: "How We Work",
    subtitle: "Title info description details",
  },
  "help-banner-1": {
    title: "Looking for Help!",
    description:
      "We are updating our Premium products with real-time support and a dedicated consultant to guide your soulmate search.",
  },
  "help-banner-2": {
    title: "Ready to Start Your Construction Project?",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi.",
    buttonText: "Request a Free Quote",
  },
  "coming-soon": {
    title: "Maundy",
    tagline: "We are still working on our website. Stay tuned for updates!",
  },
  "other-pages": {
    sectionTitle: "My Projects",
    sectionSubtitle: "Mini info section details",
    title: "Title Here Lorem ipsum dolor sit amet Lorem ipsum dolor",
    author: "Author name",
    date: "25 Jan 2026",
  },
  clients: {
    title: "Clients",
    description:
      "Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit",
    logoSlides: "",
  },
  excellence: {
    heading: "Building Excellence Since 1995",
    headingUnderline: "Building Excellence",
    paragraph1:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    paragraph2:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    statsLines: `25+|Years Experience
500+|Projects Completed
100%|Client Satisfaction
48|Team Members`,
  },
  "scale-operations": {
    tag: "Transform Your Business",
    heading: "Ready to Scale Your Corporate Operations?",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
    features: `Advanced Analytics Dashboard
24/7 Enterprise Support
Custom Integration Solutions`,
    primaryButtonText: "Start Free Trial",
    primaryButtonHref: "#",
    secondaryButtonText: "Schedule Demo",
    secondaryButtonHref: "#",
    trustText: "Trusted by 500+ companies worldwide",
    ratingText: "4.9/5 (2,300+ reviews)",
  },
  team: {
    title: "Team",
    subtitle: "Our Hardworking Team",
  },
  "zi-core-package": {
    sectionTitle: "",
    sectionSubtitle: "",
    headingBefore: "A Global ",
    headingAccent: "Zi Core",
    headingAfter: " Development Package",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    youtubeUrl: "https://youtu.be/mm8ubTNbsTQ",
    getStartedLabel: "Get Started",
    getStartedHref: "/zi-core-package",
    watchDemoLabel: "Watch Demo",
    watchDemoUrl: "https://youtu.be/mm8ubTNbsTQ",
  },
  hero: {
    slide1Title: "Ready-to-Wear, Ready to Style",
    slide1ShowTitle: "yes",
    slide1Subtitle: "Discover curated collections for every occasion.",
    slide1ShowSubtitle: "yes",
    slide1ButtonLabel: "SHOP NOW",
    slide1ButtonHref: "/shop",
    slide1ShowButton: "yes",
    slide2Title: "New Arrivals Every Week",
    slide2ShowTitle: "yes",
    slide2Subtitle: "Fresh styles and exclusive drops — shop the latest looks.",
    slide2ShowSubtitle: "yes",
    slide2ButtonLabel: "SHOP NOW",
    slide2ButtonHref: "/shop",
    slide2ShowButton: "yes",
    slide3Title: "Premium Quality, Everyday Comfort",
    slide3ShowTitle: "yes",
    slide3Subtitle: "Crafted pieces designed for confidence and all-day wear.",
    slide3ShowSubtitle: "yes",
    slide3ButtonLabel: "SHOP NOW",
    slide3ButtonHref: "/shop",
    slide3ShowButton: "yes",
  },
  "ecom-trust-bar": {
    items: [
      "package|Easy 30-day exchange|Have Arrange team.",
      "box|Best Quality|Serve with own applications.",
      "headset|Online Support|Give support on your availability",
      "truck|Ships across Pakistan|Follow system driven approach",
    ].join("\n"),
  },
  "ecom-categories-round": {
    scrollMode: "auto",
  },
  "ecom-categories-tabs": {
    title: "Shop by Category",
    subtitle: "Browse products from every category",
    textAlign: "center",
    showCategoryTabs: "yes",
    showHeaderButton: "no",
    buttonLabel: "Explore All",
    buttonHref: "",
    productsPerRow: "5",
    productsCount: "10",
  },
  "ecom-category-hero": {
    buttonLabel: "View Items",
    sliderEnabled: "yes",
    mainCategories: "",
    sideCategories: "",
    showArrows: "yes",
    autoplay: "yes",
    mainTitle: "",
    side1Title: "",
    side2Title: "",
    mainImageUrl: "",
    side1ImageUrl: "",
    side2ImageUrl: "",
  },
  "ecom-products-women": {
    title: "Women",
    subtitle: "Design your look | find anywhere else",
    textAlign: "center",
    showCategoryTabs: "yes",
    showHeaderButton: "no",
    buttonLabel: "Explore All",
    buttonHref: "",
    categories: "",
    productsPerRow: "5",
    rows: "1",
  },
  "ecom-products-men": {
    title: "Men",
    subtitle: "Create your lifestyle | All in clothing movement",
    textAlign: "center",
    showCategoryTabs: "yes",
    showHeaderButton: "no",
    buttonLabel: "Explore All",
    buttonHref: "",
    categories: "",
    productsPerRow: "5",
    rows: "1",
  },
  "ecom-brand-promo": {
    layout: "fullBanner",
    eyebrow: "Brand Promotional Title",
    title: "Elevate your everyday style",
    description:
      "Discover premium ready-to-wear pieces crafted for comfort and confidence. Shop the latest arrivals and exclusive offers.",
    buttonLabel: "View Products",
    buttonHref: "/shop",
    videoUrl: "",
  },
  "ecom-brand-promo-2": {
    layout: "fullBanner",
    eyebrow: "Brand Promotional Title",
    title: "Elevate your everyday style",
    description:
      "Discover premium ready-to-wear pieces crafted for comfort and confidence. Shop the latest arrivals and exclusive offers.",
    buttonLabel: "View Products",
    buttonHref: "/shop",
    videoUrl: "",
  },
  "ecom-reels": {
    title: "",
    products: "",
    showArrows: "yes",
    preferVideo2: "no",
  },
  "ecom-reviews-support": {
    reviewsTitle: "Our Reviews",
    reviewsRating: "4.1/5 (1000+)",
    reviewsButtonLabel: "Write a Review",
    reviewsViewButtonLabel: "View Reviews",
    supportTitle: "Support Team",
    supportMembers: "Rose, Misha, Ashi",
    supportButtonLabel: "Chat on WhatsApp",
  },
  "ecom-about-hero": {
    title: "Building Excellence Through Innovation and Integrity",
    paragraphs:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    showStats: "yes",
    statsLines: `15+|Years of Excellence
500+|Satisfied Clients
1200+|Projects Completed`,
  },
  "ecom-about-process": {
    title: "How We Work",
    subtitle: "Our proven process ensures exceptional results for every project",
    stepsLines: `Research & Planning|We start by understanding your needs and conducting thorough research to create a solid foundation for your project.
Creative Solutions|Our team brainstorms innovative ideas and develops creative solutions tailored to your unique requirements.
Development|We bring your vision to life with meticulous attention to detail and cutting-edge technology.
Launch & Support|We ensure a smooth launch and provide ongoing support to help you achieve long-term success.`,
  },
};

/** Client logo row for `ClientsSection` — parsed from Sp Builder multiline field. */
export type ClientLogoSlideItem = { imageUrl: string; alt?: string };

export function parseClientLogoSlidesMultiline(raw: string): ClientLogoSlideItem[][] | undefined {
  const text = String(raw ?? "").trim();
  if (!text) return undefined;
  const slides: ClientLogoSlideItem[][] = [];
  let current: ClientLogoSlideItem[] = [];
  const flush = () => {
    if (current.length) {
      slides.push(current);
      current = [];
    }
  };
  for (const line of String(raw).split("\n")) {
    const t = line.trim();
    if (!t) {
      flush();
      continue;
    }
    const pipe = t.indexOf("|");
    if (pipe >= 0) {
      current.push({
        imageUrl: t.slice(0, pipe).trim(),
        alt: t.slice(pipe + 1).trim() || undefined,
      });
    } else {
      current.push({ imageUrl: t, alt: undefined });
    }
  }
  flush();
  return slides.length ? slides : undefined;
}

export type StatLineItem = { value: string; label: string };

export type StepLineItem = { title: string; description: string };

export function parseStepLinesMultiline(raw: string): StepLineItem[] | undefined {
  const lines = String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return undefined;
  const out: StepLineItem[] = [];
  for (const line of lines) {
    const pipe = line.indexOf("|");
    if (pipe < 0) continue;
    const title = line.slice(0, pipe).trim();
    const description = line.slice(pipe + 1).trim();
    if (title && description) out.push({ title, description });
  }
  return out.length ? out : undefined;
}

export function parseStatLinesMultiline(raw: string): StatLineItem[] | undefined {
  const lines = String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return undefined;
  const out: StatLineItem[] = [];
  for (const line of lines) {
    const pipe = line.indexOf("|");
    if (pipe < 0) continue;
    const value = line.slice(0, pipe).trim();
    const label = line.slice(pipe + 1).trim();
    if (value && label) out.push({ value, label });
  }
  return out.length ? out : undefined;
}

export function parseMultilineStringArray(raw: string): string[] | undefined {
  const lines = String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : undefined;
}

export function getEditFieldDefsForSection(sectionId: string): SectionEditFieldDef[] {
  if (sectionId.startsWith("custom-")) return [];
  return SECTION_EDIT_FIELD_DEFS[sectionId] ?? [];
}

/** Template id used for field defs / defaults (duplicates point at baseSectionId). */
export function resolveSectionTemplateId(section: {
  sectionId: string;
  baseSectionId?: string;
  isCustom?: boolean;
}): string {
  if (section.isCustom) return section.sectionId;
  const base = String(section.baseSectionId || "").trim();
  return base || section.sectionId;
}

/**
 * When rendering a duplicated built-in section, alias its own content under the
 * template sectionId so existing parsers keep working without changes.
 */
export function aliasSectionContentMap(
  contentMap: Record<string, Record<string, string>> | undefined,
  sectionId: string,
  templateId: string
): Record<string, Record<string, string>> | undefined {
  if (!contentMap || !templateId || templateId === sectionId) return contentMap;
  const own = contentMap[sectionId];
  if (!own) return contentMap;
  return { ...contentMap, [templateId]: own };
}

export function parseContentJsonString(raw?: string | null): Record<string, string> {
  if (!raw || typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, v == null ? "" : String(v)])
    );
  } catch {
    return {};
  }
}

export function mergeContentForEditor(sectionId: string, rawJson?: string | null): Record<string, string> {
  const defs = getEditFieldDefsForSection(sectionId);
  const defaults = SECTION_CONTENT_DEFAULTS[sectionId] ?? {};
  const fromDb = parseContentJsonString(rawJson);
  const out: Record<string, string> = {};
  for (const d of defs) {
    const v = fromDb[d.key];
    out[d.key] = v !== undefined && v !== "" ? v : (defaults[d.key] ?? "");
  }
  return out;
}

export function packContentForSave(sectionId: string, fields: Record<string, string>): string {
  const defs = getEditFieldDefsForSection(sectionId);
  const defaults = SECTION_CONTENT_DEFAULTS[sectionId] ?? {};
  const out: Record<string, string> = {};
  for (const d of defs) {
    const val = (fields[d.key] ?? "").trim();
    const def = (defaults[d.key] ?? "").trim();
    if (val !== def) out[d.key] = fields[d.key] ?? "";
  }
  return JSON.stringify(out);
}

export function buildSectionContentMapFromList(
  list: { sectionId: string; contentJson?: string }[]
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const s of list) {
    if (!s.sectionId) continue;
    const parsed = parseContentJsonString(s.contentJson);
    if (Object.keys(parsed).length === 0) continue;
    map[s.sectionId] = parsed;
  }
  return map;
}

/** Resolve override: non-empty DB value wins, else fallback (page default). */
export function contentOverride(
  contentMap: Record<string, Record<string, string>>,
  sectionId: string,
  key: string,
  fallback: string
): string {
  const v = contentMap[sectionId]?.[key];
  if (v == null) return fallback;
  const t = String(v).trim();
  return t !== "" ? String(v) : fallback;
}
