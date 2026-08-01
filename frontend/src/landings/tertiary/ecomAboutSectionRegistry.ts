/** Sp eCom — About Us page sections */

export interface EcomAboutSectionDef {
  sectionId: string;
  label: string;
  subInfo: string;
  order: number;
  defaultEnabled: boolean;
  alwaysInBuilder: boolean;
}

export const SP_ECOM_ABOUT_SECTIONS: EcomAboutSectionDef[] = [
  {
    sectionId: "ecom-about-hero",
    label: "About Hero",
    subInfo: "Title, story paragraphs, optional count stats & hero image",
    order: 0,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
  {
    sectionId: "ecom-about-process",
    label: "How We Work",
    subInfo: "Process steps with icons",
    order: 1,
    defaultEnabled: true,
    alwaysInBuilder: true,
  },
];

export const SP_ECOM_ABOUT_ALWAYS_IN_BUILDER_IDS = new Set(
  SP_ECOM_ABOUT_SECTIONS.filter((s) => s.alwaysInBuilder).map((s) => s.sectionId)
);

export const SP_ECOM_ABOUT_DEFAULT_ENABLED_IDS = new Set(
  SP_ECOM_ABOUT_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.sectionId)
);

export const SP_ECOM_ABOUT_SECTION_SUB_INFO: Record<string, string> = Object.fromEntries(
  SP_ECOM_ABOUT_SECTIONS.map((s) => [s.sectionId, s.subInfo])
);

export const SP_ECOM_ABOUT_DEFAULT_ORDER = SP_ECOM_ABOUT_SECTIONS.map((s) => s.sectionId);
