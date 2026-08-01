export type TabsAlign = "left" | "center" | "right";
export type CategoryMenuStyle = "dropdown" | "inline";

export type NavItemKey = "home" | "products" | "categories" | "blogs" | "about";
export type NavSlotKey = NavItemKey | `category:${string}`;

export const NAV_ITEM_KEYS: NavItemKey[] = [
  "home",
  "products",
  "categories",
  "blogs",
  "about",
];

export const NAV_ITEM_LABELS: Record<NavItemKey, string> = {
  home: "Home",
  products: "Products / Shop",
  categories: "Categories",
  blogs: "Blogs / Stories",
  about: "About Us",
};

export const NAV_CATEGORY_NONE = "__none__";

export type NavbarSettings = {
  tabsAlign: TabsAlign;
  brandNameFontFamily: string;
  brandNameFontWeight: string;
  categoryMenuStyle: CategoryMenuStyle;
  showHome: boolean;
  showProducts: boolean;
  showCategories: boolean;
  showBlogs: boolean;
  showAboutUs: boolean;
  blogsLabel: string;
  aboutLabel: string;
  /** Drag order — may include category:<id> slots for inline mode */
  navItemOrder: NavSlotKey[];
  /**
   * Category IDs for dropdown mode (and fallback).
   * Empty = all. ["__none__"] = none.
   */
  navCategoryIds: string[];
};

export const DEFAULT_NAVBAR_SETTINGS: NavbarSettings = {
  tabsAlign: "center",
  brandNameFontFamily: "Inter",
  brandNameFontWeight: "600",
  categoryMenuStyle: "dropdown",
  showHome: true,
  showProducts: true,
  showCategories: true,
  showBlogs: true,
  showAboutUs: true,
  blogsLabel: "Blogs",
  aboutLabel: "About Us",
  navItemOrder: [...NAV_ITEM_KEYS],
  navCategoryIds: [],
};

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

export function isCategorySlot(key: string): key is `category:${string}` {
  return key.startsWith("category:") && key.length > "category:".length;
}

export function categoryIdFromSlot(key: string): string {
  return key.slice("category:".length);
}

export function toCategorySlot(id: string): `category:${string}` {
  return `category:${String(id).trim()}`;
}

export function normalizeNavCategoryIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const unique: string[] = [];
  for (const value of raw) {
    const id = String(value || "").trim();
    if (id && !unique.includes(id)) unique.push(id);
  }
  if (unique.includes(NAV_CATEGORY_NONE)) {
    return unique.length === 1 ? [NAV_CATEGORY_NONE] : unique.filter((id) => id !== NAV_CATEGORY_NONE);
  }
  return unique;
}

export function normalizeNavItemOrder(raw: unknown): NavSlotKey[] {
  const core = new Set<string>(NAV_ITEM_KEYS);
  const fromRaw = Array.isArray(raw)
    ? raw.map((v) => String(v || "").trim()).filter(Boolean)
    : [];
  const unique: NavSlotKey[] = [];
  for (const key of fromRaw) {
    const lower = key.toLowerCase();
    if (core.has(lower)) {
      if (!unique.includes(lower as NavItemKey)) unique.push(lower as NavItemKey);
      continue;
    }
    if (isCategorySlot(key)) {
      if (!unique.includes(key)) unique.push(key);
      continue;
    }
    // tolerate Category:Id casing
    if (lower.startsWith("category:") && lower.length > "category:".length) {
      const slot = `category:${key.slice("category:".length)}` as `category:${string}`;
      if (!unique.includes(slot)) unique.push(slot);
    }
  }
  const hasCatSlots = unique.some((k) => isCategorySlot(k));
  for (const key of NAV_ITEM_KEYS) {
    if (key === "categories" && hasCatSlots) continue;
    if (!unique.includes(key)) unique.push(key);
  }
  return unique;
}

export function navItemVisibilityKey(
  item: NavItemKey
): "showHome" | "showProducts" | "showCategories" | "showBlogs" | "showAboutUs" {
  switch (item) {
    case "home":
      return "showHome";
    case "products":
      return "showProducts";
    case "categories":
      return "showCategories";
    case "blogs":
      return "showBlogs";
    case "about":
      return "showAboutUs";
  }
}

export type NavCategoryLike = { _id: string; name: string };

export function resolveNavbarCategories<T extends NavCategoryLike>(
  all: T[],
  navCategoryIds: string[] | undefined | null
): T[] {
  const list = Array.isArray(all) ? all : [];
  const ids = normalizeNavCategoryIds(navCategoryIds);
  if (!ids.length) return list;
  if (ids.length === 1 && ids[0] === NAV_CATEGORY_NONE) return [];
  const map = new Map(list.map((c) => [String(c._id), c]));
  const ordered: T[] = [];
  for (const id of ids) {
    if (id === NAV_CATEGORY_NONE) continue;
    const hit = map.get(id);
    if (hit) ordered.push(hit);
  }
  return ordered;
}

/** Build drag-list slots for Header UI (inline expands categories into named rows). */
export function buildHeaderDragSlots(
  settings: NavbarSettings,
  selectedCategoryIds: string[]
): NavSlotKey[] {
  const order = normalizeNavItemOrder(settings.navItemOrder);
  if (settings.categoryMenuStyle !== "inline") {
    return order.filter((k) => !isCategorySlot(k));
  }

  const slots: NavSlotKey[] = [];
  let categoriesExpanded = false;
  const selectedSet = new Set(selectedCategoryIds);
  const usedCats = new Set<string>();

  for (const key of order) {
    if (key === "categories") {
      for (const id of selectedCategoryIds) {
        slots.push(toCategorySlot(id));
        usedCats.add(id);
      }
      categoriesExpanded = true;
      continue;
    }
    if (isCategorySlot(key)) {
      const id = categoryIdFromSlot(key);
      if (selectedSet.has(id) && !usedCats.has(id)) {
        slots.push(key);
        usedCats.add(id);
      }
      continue;
    }
    slots.push(key);
  }

  if (!categoriesExpanded) {
    for (const id of selectedCategoryIds) {
      if (!usedCats.has(id)) slots.push(toCategorySlot(id));
    }
  }

  return slots;
}

/** Persist drag slots back into navItemOrder + navCategoryIds. */
export function slotsToNavbarOrder(
  slots: NavSlotKey[],
  style: CategoryMenuStyle
): { navItemOrder: NavSlotKey[]; navCategoryIds: string[] } {
  if (style === "dropdown") {
    const core = slots.filter((k): k is NavItemKey => !isCategorySlot(k));
    return {
      navItemOrder: normalizeNavItemOrder(core),
      navCategoryIds: [], // caller should keep existing navCategoryIds for dropdown
    };
  }

  const navItemOrder: NavSlotKey[] = [];
  const navCategoryIds: string[] = [];

  for (const key of slots) {
    if (isCategorySlot(key)) {
      const id = categoryIdFromSlot(key);
      if (!navCategoryIds.includes(id)) navCategoryIds.push(id);
      navItemOrder.push(key);
      continue;
    }
    if (key === "categories") continue; // inline uses category: slots only
    navItemOrder.push(key);
  }

  return {
    navItemOrder: normalizeNavItemOrder(navItemOrder),
    navCategoryIds: navCategoryIds.length ? navCategoryIds : [NAV_CATEGORY_NONE],
  };
}

export function normalizeNavbarSettings(
  raw?: Partial<NavbarSettings> | Record<string, unknown> | null
): NavbarSettings {
  const src = raw && typeof raw === "object" ? raw : {};
  const align = String((src as NavbarSettings).tabsAlign || "").trim().toLowerCase();
  const style = String((src as NavbarSettings).categoryMenuStyle || "")
    .trim()
    .toLowerCase();
  const blogsLabel = String((src as NavbarSettings).blogsLabel ?? "").trim();
  const aboutLabel = String((src as NavbarSettings).aboutLabel ?? "").trim();

  return {
    tabsAlign: align === "left" || align === "right" || align === "center" ? align : "center",
    brandNameFontFamily:
      String((src as NavbarSettings).brandNameFontFamily || "").trim() ||
      DEFAULT_NAVBAR_SETTINGS.brandNameFontFamily,
    brandNameFontWeight:
      String((src as NavbarSettings).brandNameFontWeight || "").trim() ||
      DEFAULT_NAVBAR_SETTINGS.brandNameFontWeight,
    categoryMenuStyle: style === "inline" ? "inline" : "dropdown",
    showHome: asBool((src as NavbarSettings).showHome, true),
    showProducts: asBool((src as NavbarSettings).showProducts, true),
    showCategories: asBool((src as NavbarSettings).showCategories, true),
    showBlogs: asBool((src as NavbarSettings).showBlogs, true),
    showAboutUs: asBool((src as NavbarSettings).showAboutUs, true),
    blogsLabel: blogsLabel || DEFAULT_NAVBAR_SETTINGS.blogsLabel,
    aboutLabel: aboutLabel || DEFAULT_NAVBAR_SETTINGS.aboutLabel,
    navItemOrder: normalizeNavItemOrder((src as NavbarSettings).navItemOrder),
    navCategoryIds: normalizeNavCategoryIds((src as NavbarSettings).navCategoryIds),
  };
}
