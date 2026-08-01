import React, { useEffect, useMemo, useState } from "react";
import { PanelTop, Edit, RotateCcw, GripVertical } from "lucide-react";
import { getCompany, updateCompany } from "@/api/company.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import TextAlignPicker, { type TextAlignValue } from "@/components/ui/TextAlignPicker";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import { fetchCategoriesShared, type CategoryRecord } from "@/utils/categoryFetch";
import {
  BRAND_NAME_FONT_FAMILIES,
  BRAND_NAME_FONT_WEIGHTS,
  DEFAULT_BRAND_NAME_FONT_FAMILY,
  DEFAULT_BRAND_NAME_FONT_WEIGHT,
  getBrandNameFontStyle,
  normalizeBrandNameFontFamily,
  normalizeBrandNameFontWeight,
} from "@/utils/brandNameFont";
import {
  DEFAULT_NAVBAR_SETTINGS,
  NAV_ITEM_LABELS,
  buildHeaderDragSlots,
  categoryIdFromSlot,
  isCategorySlot,
  normalizeNavCategoryIds,
  normalizeNavItemOrder,
  normalizeNavbarSettings,
  navItemVisibilityKey,
  slotsToNavbarOrder,
  toCategorySlot,
  type NavSlotKey,
  type NavbarSettings,
} from "@/utils/navbarSettings";

function normalizeNavbarSettingsState(raw?: Partial<NavbarSettings> | null): NavbarSettings {
  const base = normalizeNavbarSettings(raw);
  return {
    ...base,
    brandNameFontFamily: normalizeBrandNameFontFamily(
      raw?.brandNameFontFamily ?? base.brandNameFontFamily
    ),
    brandNameFontWeight: normalizeBrandNameFontWeight(
      raw?.brandNameFontWeight ?? base.brandNameFontWeight
    ),
  };
}

function mergeCategoryOrder(allIds: string[], selectedIds: string[]): string[] {
  const selected = selectedIds.filter((id) => allIds.includes(id));
  const rest = allIds.filter((id) => !selected.includes(id));
  return selected.length ? [...selected, ...rest] : [...allIds];
}

export default function HeaderPage() {
  const { success, error } = useToast();
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [settings, setSettings] = useState<NavbarSettings>({ ...DEFAULT_NAVBAR_SETTINGS });
  const [original, setOriginal] = useState<NavbarSettings>({ ...DEFAULT_NAVBAR_SETTINGS });
  const [draggingItem, setDraggingItem] = useState<NavSlotKey | null>(null);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) {
      const nav = normalizeNavbarSettingsState(cached.navbarSettings);
      setSettings(nav);
      setOriginal(nav);
      setCompanyName(String(cached.company || "").trim());
      setInitialLoading(false);
    }
    void (async () => {
      try {
        const [data, cats] = await Promise.all([
          getCompany(),
          fetchCategoriesShared({ preferCache: true }).catch(() => []),
        ]);
        const nav = normalizeNavbarSettingsState(data?.navbarSettings);
        setSettings(nav);
        setOriginal(nav);
        setCompanyName(String(data?.company || "").trim());
        setCategories(Array.isArray(cats) ? cats : []);
        if (data) setCompanyCache(data);
      } catch {
        if (!cached) error("Failed to load header settings");
      } finally {
        setInitialLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allCategoryIds = useMemo(
    () => categories.map((c) => String(c._id)).filter(Boolean),
    [categories]
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryRecord>();
    for (const cat of categories) map.set(String(cat._id), cat);
    return map;
  }, [categories]);

  const categoryDisplayOrder = useMemo(() => {
    const saved = normalizeNavCategoryIds(settings.navCategoryIds).filter(
      (id) => id !== "__none__"
    );
    return mergeCategoryOrder(allCategoryIds, saved);
  }, [allCategoryIds, settings.navCategoryIds]);

  const selectedCategoryIds = useMemo(() => {
    const saved = normalizeNavCategoryIds(settings.navCategoryIds);
    if (saved.length === 1 && saved[0] === "__none__") return [];
    if (!saved.length) return allCategoryIds;
    return saved.filter((id) => allCategoryIds.includes(id));
  }, [settings.navCategoryIds, allCategoryIds]);

  const isCategoryChecked = (id: string) => selectedCategoryIds.includes(id);

  const patch = <K extends keyof NavbarSettings>(key: K, value: NavbarSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const headerSlots = useMemo(
    () => buildHeaderDragSlots(settings, selectedCategoryIds),
    [settings, selectedCategoryIds]
  );

  const applyHeaderSlots = (slots: NavSlotKey[], style = settings.categoryMenuStyle) => {
    const mapped = slotsToNavbarOrder(slots, style);
    setSettings((prev) => ({
      ...prev,
      categoryMenuStyle: style,
      navItemOrder: mapped.navItemOrder,
      navCategoryIds:
        style === "inline"
          ? mapped.navCategoryIds
          : prev.navCategoryIds,
      showCategories: style === "inline" ? true : prev.showCategories,
    }));
  };

  const reorderHeaderSlots = (fromKey: NavSlotKey, toKey: NavSlotKey) => {
    if (fromKey === toKey) return;
    const slots = [...headerSlots];
    const from = slots.indexOf(fromKey);
    const to = slots.indexOf(toKey);
    if (from < 0 || to < 0) return;
    slots.splice(from, 1);
    slots.splice(to, 0, fromKey);
    applyHeaderSlots(slots);
  };

  const setCategoryMenuStyle = (style: "dropdown" | "inline") => {
    if (style === "inline") {
      const slots = buildHeaderDragSlots(
        { ...settings, categoryMenuStyle: "inline", showCategories: true },
        selectedCategoryIds
      );
      // Prefer Home then categories then the rest
      const withoutCats = slots.filter((s) => !isCategorySlot(s) && s !== "categories");
      const homeIdx = withoutCats.indexOf("home");
      const core =
        homeIdx >= 0
          ? [
              ...withoutCats.slice(0, homeIdx + 1),
              ...selectedCategoryIds.map(toCategorySlot),
              ...withoutCats.slice(homeIdx + 1),
            ]
          : [...selectedCategoryIds.map(toCategorySlot), ...withoutCats];
      applyHeaderSlots(core, "inline");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      categoryMenuStyle: "dropdown",
      navItemOrder: normalizeNavItemOrder(
        prev.navItemOrder.filter((k) => !isCategorySlot(k))
      ),
    }));
  };

  const setCategorySelectionFromOrder = (
    order: string[],
    selectedSet: Set<string>,
    opts?: { persistAllOrder?: boolean }
  ) => {
    const nextSelected = order.filter((id) => selectedSet.has(id));
    if (!nextSelected.length) {
      patch("navCategoryIds", ["__none__"]);
      return;
    }
    const allSelected =
      nextSelected.length === allCategoryIds.length &&
      allCategoryIds.every((id) => selectedSet.has(id));
    if (allSelected && !opts?.persistAllOrder) {
      patch("navCategoryIds", []);
      return;
    }
    patch("navCategoryIds", nextSelected);
  };

  const toggleCategory = (id: string, checked: boolean) => {
    const selected = new Set(selectedCategoryIds);
    if (checked) selected.add(id);
    else selected.delete(id);

    if (settings.categoryMenuStyle === "inline") {
      let slots = headerSlots.filter((s) => !(isCategorySlot(s) && categoryIdFromSlot(s) === id));
      if (checked) {
        const homeIdx = slots.indexOf("home");
        const insertAt = homeIdx >= 0 ? homeIdx + 1 : 0;
        // put new category after home (or after last category following home)
        let at = insertAt;
        while (at < slots.length && isCategorySlot(slots[at])) at += 1;
        slots = [...slots.slice(0, at), toCategorySlot(id), ...slots.slice(at)];
      }
      const nextSelected = slots.filter(isCategorySlot).map(categoryIdFromSlot);
      // also include other selected that might not be in slots yet
      for (const sid of selected) {
        if (!nextSelected.includes(sid)) {
          const homeIdx = slots.indexOf("home");
          const insertAt = homeIdx >= 0 ? homeIdx + 1 : 0;
          slots = [...slots.slice(0, insertAt), toCategorySlot(sid), ...slots.slice(insertAt)];
          nextSelected.push(sid);
        }
      }
      applyHeaderSlots(slots.filter((s) => !isCategorySlot(s) || selected.has(categoryIdFromSlot(s))));
      return;
    }

    setCategorySelectionFromOrder(categoryDisplayOrder, selected);
  };

  const reorderCategories = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const order = [...categoryDisplayOrder];
    const from = order.indexOf(fromId);
    const to = order.indexOf(toId);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, fromId);
    const selected = new Set(selectedCategoryIds);

    if (settings.categoryMenuStyle === "inline") {
      const selectedOrdered = order.filter((id) => selected.has(id));
      const nonCat = headerSlots.filter((s) => !isCategorySlot(s) && s !== "categories");
      const homeIdx = nonCat.indexOf("home");
      const slots =
        homeIdx >= 0
          ? [
              ...nonCat.slice(0, homeIdx + 1),
              ...selectedOrdered.map(toCategorySlot),
              ...nonCat.slice(homeIdx + 1),
            ]
          : [...selectedOrdered.map(toCategorySlot), ...nonCat];
      // Preserve relative drag order of category slots if user already mixed them in header list
      const existingCatOrder = headerSlots.filter(isCategorySlot).map(categoryIdFromSlot);
      if (existingCatOrder.length) {
        const fromSlot = toCategorySlot(fromId);
        const toSlot = toCategorySlot(toId);
        const slotsCopy = [...headerSlots];
        const fi = slotsCopy.indexOf(fromSlot);
        const ti = slotsCopy.indexOf(toSlot);
        if (fi >= 0 && ti >= 0) {
          slotsCopy.splice(fi, 1);
          slotsCopy.splice(ti, 0, fromSlot);
          applyHeaderSlots(slotsCopy);
          return;
        }
      }
      applyHeaderSlots(slots);
      return;
    }

    setCategorySelectionFromOrder(order, selected, { persistAllOrder: true });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateCompany({
        navbarSettings: normalizeNavbarSettingsState(settings),
      });
      const nav = normalizeNavbarSettingsState(
        updated?.navbarSettings ?? settings
      );
      setSettings(nav);
      setOriginal(nav);
      if (updated) setCompanyCache(updated);
      success("Header settings updated successfully!");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e instanceof Error ? e.message : null) ||
        "Failed to update header settings";
      error(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(original);
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <PanelTop className="w-7 h-7 theme-text-primary" />
          <h1 className="text-3xl font-bold theme-heading">Header</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white theme-button"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {saving ? <CircularLoader size={16} color="white" /> : <Edit size={16} />}
            Update
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Header / Navbar</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Control storefront menu: dropdown vs inline categories, labels, and visibility.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nav bar tabs align
            </label>
            <TextAlignPicker
              value={settings.tabsAlign || "center"}
              onChange={(value: TextAlignValue) => patch("tabsAlign", value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Left places tabs next to the logo. Center keeps them in the middle. Right groups tabs
              with cart/profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category menu style
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  settings.categoryMenuStyle !== "inline"
                    ? "text-white border-transparent"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                style={
                  settings.categoryMenuStyle !== "inline"
                    ? { backgroundColor: "var(--theme-primary)" }
                    : undefined
                }
                onClick={() => setCategoryMenuStyle("dropdown")}
              >
                Dropdown
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  settings.categoryMenuStyle === "inline"
                    ? "text-white border-transparent"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                style={
                  settings.categoryMenuStyle === "inline"
                    ? { backgroundColor: "var(--theme-primary)" }
                    : undefined
                }
                onClick={() => setCategoryMenuStyle("inline")}
              >
                Inline links (no dropdown)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Inline: each ticked category (Axes, Swords…) becomes its own header link — drag them
              under Home in the list below.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show in header (drag to reorder)
            </label>
            <div className="flex flex-col gap-2">
              {headerSlots.map((slotKey) => {
                if (isCategorySlot(slotKey)) {
                  const catId = categoryIdFromSlot(slotKey);
                  const cat = categoryById.get(catId);
                  if (!cat) return null;
                  return (
                    <div
                      key={slotKey}
                      draggable
                      onDragStart={() => setDraggingItem(slotKey)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggingItem || draggingItem === slotKey) return;
                        reorderHeaderSlots(draggingItem, slotKey);
                      }}
                      onDragEnd={() => setDraggingItem(null)}
                      className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 cursor-grab active:cursor-grabbing ${
                        draggingItem === slotKey
                          ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
                          : "border-gray-200"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                      <span className="truncate font-medium">{cat.name}</span>
                      <span className="text-[11px] text-gray-400 ml-auto shrink-0">Category</span>
                    </div>
                  );
                }

                if (slotKey === "categories" && settings.categoryMenuStyle === "inline") {
                  return null;
                }

                const visKey = navItemVisibilityKey(slotKey);
                return (
                  <div
                    key={slotKey}
                    draggable
                    onDragStart={() => setDraggingItem(slotKey)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!draggingItem || draggingItem === slotKey) return;
                      reorderHeaderSlots(draggingItem, slotKey);
                    }}
                    onDragEnd={() => setDraggingItem(null)}
                    className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 cursor-grab active:cursor-grabbing ${
                      draggingItem === slotKey
                        ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
                        : "border-gray-200"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                    <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={settings[visKey] !== false}
                        onChange={(e) => patch(visKey, e.target.checked)}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="truncate">{NAV_ITEM_LABELS[slotKey]}</span>
                    </label>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Example: Home → Axes → Pocket Knife → News. Use Inline links, tick categories below,
              then drag them under Home.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Categories in navbar
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    if (settings.categoryMenuStyle === "inline") {
                      const nonCat = headerSlots.filter(
                        (s) => !isCategorySlot(s) && s !== "categories"
                      );
                      const homeIdx = nonCat.indexOf("home");
                      const slots =
                        homeIdx >= 0
                          ? [
                              ...nonCat.slice(0, homeIdx + 1),
                              ...allCategoryIds.map(toCategorySlot),
                              ...nonCat.slice(homeIdx + 1),
                            ]
                          : [...allCategoryIds.map(toCategorySlot), ...nonCat];
                      applyHeaderSlots(slots);
                      return;
                    }
                    patch("navCategoryIds", []);
                  }}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    if (settings.categoryMenuStyle === "inline") {
                      applyHeaderSlots(
                        headerSlots.filter((s) => !isCategorySlot(s) && s !== "categories")
                      );
                      return;
                    }
                    patch("navCategoryIds", ["__none__"]);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-3 py-4">
                No categories yet. Add categories in Admin → Categories, then choose which ones appear
                in the header.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {categoryDisplayOrder.map((catId) => {
                  const cat = categoryById.get(catId);
                  if (!cat) return null;
                  return (
                    <div
                      key={catId}
                      draggable
                      onDragStart={() => setDraggingCategoryId(catId)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!draggingCategoryId || draggingCategoryId === catId) return;
                        reorderCategories(draggingCategoryId, catId);
                      }}
                      onDragEnd={() => setDraggingCategoryId(null)}
                      className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 cursor-grab active:cursor-grabbing ${
                        draggingCategoryId === catId
                          ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
                          : "border-gray-200"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                      <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={isCategoryChecked(catId)}
                          onChange={(e) => toggleCategory(catId, e.target.checked)}
                          className="rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Tick the categories to show in the header. Drag to set their order (inline / dropdown).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blogs link label (e.g. News)
              </label>
              <input
                type="text"
                value={settings.blogsLabel || "Blogs"}
                onChange={(e) => patch("blogsLabel", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                placeholder="e.g. News"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About link label
              </label>
              <input
                type="text"
                value={settings.aboutLabel || "About Us"}
                onChange={(e) => patch("aboutLabel", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                placeholder="About Us"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company name font
              </label>
              <select
                value={settings.brandNameFontFamily || DEFAULT_BRAND_NAME_FONT_FAMILY}
                onChange={(e) => patch("brandNameFontFamily", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              >
                {BRAND_NAME_FONT_FAMILIES.map((f) => (
                  <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company name weight
              </label>
              <select
                value={settings.brandNameFontWeight || DEFAULT_BRAND_NAME_FONT_WEIGHT}
                onChange={(e) => patch("brandNameFontWeight", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              >
                {BRAND_NAME_FONT_WEIGHTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Preview</p>
            <p
              className="text-xl sm:text-2xl"
              style={{
                color: "var(--theme-primary)",
                ...getBrandNameFontStyle(
                  settings.brandNameFontFamily,
                  settings.brandNameFontWeight
                ),
              }}
            >
              {companyName || "Company name"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
