/**
 * AI prompt / standards for SpEditor custom HTML sections.
 * Keep in sync with storefront theme vars, typography, and content width.
 */

export const SP_SECTION_AI_GUIDE_TITLE = "AI Section Guide";

export const SP_SECTION_AI_GUIDE_PROMPT = `Follow these SP standards to create this section.

OUTPUT
- Return a single self-contained HTML snippet (inline <style> + markup OK).
- Prefer a root <section>…</section>. No React/JSX. No external CSS frameworks unless already inlined.
- Must look consistent with the existing storefront (theme colors, type scale, content width).

THEME COLORS (use CSS custom properties — never hardcode brand hex unless necessary)
- Primary / accents / headings / buttons: var(--theme-primary)
- Dark / hover / secondary emphasis: var(--theme-dark)
- Light / soft backgrounds: var(--theme-light)
- Accent surfaces: var(--theme-accent)
Example: color: var(--theme-primary); background: var(--theme-primary);

TYPOGRAPHY
- Section / card heading (compact SP style): font-size: 16px; font-weight: 800; line-height: 1.3; color: var(--theme-primary);
- Body / supporting text: font-size: 12px; font-weight: 400; line-height: 1.5; color: #4b5563 (or similar gray);
- Large hero titles may be bigger, but default content headings stay 16px / 800.
- Button label text: ~16px, white on filled primary buttons.

CONTENT PAGE SIZE (match website content column)
- Outer section: width: 100%; max-width: 100%;
- Inner content wrapper (.container or .sp-content):
  - max-width: 90rem;
  - margin-left: auto; margin-right: auto;
  - padding-left / padding-right: 0.75rem (mobile) → 1rem (sm) → 1.5rem (md) → 2rem (lg);
- Full-bleed banners only: use a .banner-wrapper with width 100% and no max-width constraint on the image strip; keep text content inside the 90rem column when needed.

SPACING & RADIUS (SP Standards Kit)
- Spacing scale (px): 4, 6, 8, 12, 16, 20, 24, 28, 40, 48
- Section vertical padding: typically 40–60px top/bottom
- Radius: sm 6px / md 8px / lg 12px / pill 100px
- Buttons: widths ~100px / 175px / 380px or full; radius 6px / 10px / full; fill = background var(--theme-primary), text white

STRUCTURE PATTERN
<section style="width:100%;">
  <div class="container" style="max-width:90rem;margin:0 auto;padding:…;">
    <h2 style="font-size:16px;font-weight:800;color:var(--theme-primary);">…</h2>
    <p style="font-size:12px;…">…</p>
    …content…
  </div>
</section>

OVERALL
- Mobile-first responsive; stack columns under ~768px.
- Images: max-width:100%; height:auto.
- Keep markup clean and production-ready for SpEditor (HTML inline).
- Match the visual density and alignment of other storefront sections.`.trim();

export type SpSectionGuideBlock = {
  label: string;
  rows: { name: string; value: string }[];
};

/** Structured blocks for the on-screen guide (high-contrast UI). */
export const SP_SECTION_AI_GUIDE_BLOCKS: SpSectionGuideBlock[] = [
  {
    label: "Theme colors",
    rows: [
      { name: "Primary (headings / buttons)", value: "var(--theme-primary)" },
      { name: "Dark (hover / emphasis)", value: "var(--theme-dark)" },
      { name: "Light (soft backgrounds)", value: "var(--theme-light)" },
      { name: "Accent", value: "var(--theme-accent)" },
    ],
  },
  {
    label: "Font style",
    rows: [
      {
        name: "Heading",
        value: "font-size: 16px · font-weight: 800 · color: var(--theme-primary) · line-height: 1.3",
      },
      {
        name: "Body text",
        value: "font-size: 12px · font-weight: 400 · color: #4b5563 · line-height: 1.5",
      },
      {
        name: "Button label",
        value: "font-size: 16px · font-weight: 500–600 · color: #ffffff on primary fill",
      },
    ],
  },
  {
    label: "Content page size",
    rows: [
      { name: "Outer section", value: "width: 100% · max-width: 100%" },
      { name: "Inner content", value: "max-width: 90rem · margin: 0 auto (same as navbar / footer)" },
      {
        name: "Horizontal padding",
        value: "0.75rem → 1rem (sm) → 1.5rem (md) → 2rem (lg)",
      },
    ],
  },
  {
    label: "Spacing & radius",
    rows: [
      { name: "Spacing scale (px)", value: "4, 6, 8, 12, 16, 20, 24, 28, 40, 48" },
      { name: "Section padding", value: "40–60px top / bottom" },
      { name: "Radius", value: "sm 6px · md 8px · lg 12px · pill 100px" },
    ],
  },
  {
    label: "HTML structure",
    rows: [
      {
        name: "Output",
        value: "Self-contained inline HTML: <section> + optional <style> (no React / JSX)",
      },
      {
        name: "Pattern",
        value: "<section> → .container (90rem) → heading 16/800 → body 12px → content",
      },
      {
        name: "Responsive",
        value: "Mobile-first · stack columns under ~768px · images max-width 100%",
      },
    ],
  },
];
