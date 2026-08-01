export const DEFAULT_COLUMN_SETTINGS = {
  categoriesCount: 3,
  productsCount: 3,
  socialGalleryCount: 8,
};

export const DEFAULT_CONTACT_INFO = {
  title: "Contact",
  supportEmail: "",
  email: "",
  phone: "",
  address: "",
};

export const CONTACT_FIELD_KEYS = ["supportEmail", "email", "phone", "address"] as const;
export type ContactFieldKey = (typeof CONTACT_FIELD_KEYS)[number];

export const DEFAULT_CONTACT_FIELD_ORDER: ContactFieldKey[] = [
  "supportEmail",
  "email",
  "phone",
  "address",
];

export const CONTACT_FIELD_LABELS: Record<ContactFieldKey, string> = {
  supportEmail: "Support Email",
  email: "Email",
  phone: "Phone",
  address: "Address",
};

export function normalizeContactFieldOrder(order: unknown): ContactFieldKey[] {
  const list = Array.isArray(order) ? order.map(String) : [];
  const valid = list.filter((key): key is ContactFieldKey =>
    CONTACT_FIELD_KEYS.includes(key as ContactFieldKey)
  );
  const missing = CONTACT_FIELD_KEYS.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
}

export function normalizeContactInfo(info: Record<string, unknown> | null | undefined) {
  return {
    ...DEFAULT_CONTACT_INFO,
    ...(info || {}),
  };
}

export function getOrderedContactEntries(
  contactInfo: typeof DEFAULT_CONTACT_INFO,
  order: ContactFieldKey[]
) {
  return order
    .map((key) => ({
      key,
      label: CONTACT_FIELD_LABELS[key],
      value: String(contactInfo[key] || "").trim(),
    }))
    .filter((entry) => entry.value);
}

export const FOOTER_COLUMN_LABELS: Record<string, string> = {
  categories: "Categories",
  products: "Products",
  contact: "Contact",
  socialLinks: "Follow Us",
  socialGallery: "Social Gallery",
};

export function getSectionColumnId(index: number) {
  return `section-${index}`;
}

export function getFooterColumnLabel(id: string, sections: Array<{ title?: string }> = []) {
  if (id.startsWith("section-")) {
    const idx = Number.parseInt(id.replace("section-", ""), 10);
    if (!Number.isNaN(idx) && sections[idx]?.title) return sections[idx].title!;
    return `Section ${Number.isNaN(idx) ? "" : idx + 1}`;
  }
  return FOOTER_COLUMN_LABELS[id] || id;
}

export function buildDefaultFooterColumnOrder(sectionCount: number): string[] {
  const sectionIds = Array.from({ length: sectionCount }, (_, i) => getSectionColumnId(i));
  return ["categories", "products", ...sectionIds, "contact", "socialLinks", "socialGallery"];
}

export function normalizeFooterColumnOrder(order: unknown, sectionCount: number): string[] {
  const defaults = buildDefaultFooterColumnOrder(sectionCount);
  if (!Array.isArray(order) || order.length === 0) return defaults;
  const valid = new Set(defaults);
  const result = order.map(String).filter((id) => valid.has(id));
  for (const id of defaults) {
    if (!result.includes(id)) result.push(id);
  }
  return result;
}

export function reindexFooterColumnOrder(order: string[], removedSectionIndex: number): string[] {
  return order
    .filter((id) => id !== getSectionColumnId(removedSectionIndex))
    .map((id) => {
      if (!id.startsWith("section-")) return id;
      const idx = Number.parseInt(id.replace("section-", ""), 10);
      if (Number.isNaN(idx) || idx <= removedSectionIndex) return id;
      return getSectionColumnId(idx - 1);
    });
}

export const DEFAULT_GRID_SETTINGS = {
  productsPerRow: 4,
  blogsPerRow: 4,
  footerColumnsPerRow: 4,
};

export function parseFooterFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function normalizeFooterSettings(footer: Record<string, unknown> | null | undefined) {
  return {
    showCategories: parseFooterFlag(footer?.showCategories),
    showProducts: parseFooterFlag(footer?.showProducts),
    showSocialIcons: parseFooterFlag(footer?.showSocialIcons),
    showSocialLinks: parseFooterFlag(footer?.showSocialLinks),
    showSocialGallery:
      footer?.showSocialGallery === undefined
        ? true
        : parseFooterFlag(footer.showSocialGallery),
    showContact: parseFooterFlag(footer?.showContact),
    contactInfo: normalizeContactInfo(footer?.contactInfo as Record<string, unknown>),
    contactFieldOrder: normalizeContactFieldOrder(footer?.contactFieldOrder),
    columnOrder: normalizeFooterColumnOrder(
      footer?.columnOrder,
      Array.isArray(footer?.sections) ? footer.sections.length : 0
    ),
    columnSettings: {
      ...DEFAULT_COLUMN_SETTINGS,
      ...((footer?.columnSettings as object) || {}),
    },
    gridSettings: {
      ...DEFAULT_GRID_SETTINGS,
      ...((footer?.gridSettings as object) || {}),
    },
  };
}

export const FOOTER_COLUMN_GRID: Record<number, string> = {
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
};
