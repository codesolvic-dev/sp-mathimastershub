import React, { useEffect, useMemo, useState } from "react";
import { getCategories } from "@/api/category.api";
import { getProducts } from "@/api/product.api";
import {
  parseCategorySelectionCsv,
  packCategorySelectionCsv,
} from "@/utils/landingSectionContent";

type CategoryRow = { _id: string; name: string; icon?: string };

function productCountForCategory(
  products: { category?: { _id?: string } | string }[],
  categoryId: string
) {
  return products.filter((p) => {
    const c = p.category;
    if (!c) return false;
    if (typeof c === "string") return c === categoryId;
    return c._id === categoryId;
  }).length;
}

function CategoryThumb({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text = size === "lg" ? "text-lg" : "text-sm";
  const imageSrc = (src || "").trim();
  const [broken, setBroken] = useState(false);

  if (!imageSrc || broken) {
    return (
      <div
        className={`${dim} rounded-lg bg-gray-200 flex items-center justify-center ${text} font-semibold text-gray-500 shrink-0`}
        aria-hidden
      >
        {(name?.charAt(0) || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt=""
      className={`${dim} rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200`}
      onError={() => setBroken(true)}
    />
  );
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Show category icon thumbnails (default true). */
  showImages?: boolean;
  /** Extra hint under the header (e.g. carousel order). */
  hint?: string;
};

export default function CategoryCheckboxPicker({
  value,
  onChange,
  showImages = true,
  hint,
}: Props) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<{ category?: { _id?: string } | string }[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedIds = useMemo(() => parseCategorySelectionCsv(value), [value]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c._id, c]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as CategoryRow[];
  }, [categories, selectedIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCategories({ activeOnly: true }), getProducts({ activeOnly: true })])
      .then(([cats, prods]) => {
        if (cancelled) return;
        setCategories(
          (Array.isArray(cats) ? cats : [])
            .filter((c) => c?._id && c?.name)
            .map((c) => ({
              _id: String(c._id),
              name: String(c.name),
              icon: typeof c.icon === "string" ? c.icon : "",
            }))
        );
        setProducts(Array.isArray(prods) ? prods : []);
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    // Keep checklist visual order for newly checked; preserve prior order for existing
    const ordered: string[] = [];
    for (const prev of selectedIds) {
      if (next.has(prev)) ordered.push(prev);
    }
    for (const c of categories) {
      if (next.has(c._id) && !ordered.includes(c._id)) ordered.push(c._id);
    }
    onChange(packCategorySelectionCsv(ordered));
  };

  const moveSelected = (id: string, dir: -1 | 1) => {
    const idx = selectedIds.indexOf(id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(packCategorySelectionCsv(next));
  };

  const selectAll = () => {
    onChange(packCategorySelectionCsv(categories.map((c) => c._id)));
  };

  const clearAll = () => {
    onChange("");
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-2">Loading categories...</p>;
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">No categories found. Add categories in Admin first.</p>
    );
  }

  const selectedCount = selectedIds.length;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-600">
          {selectedCount === 0
            ? "No selection — all categories will show on page"
            : `${selectedCount} selected`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-[var(--theme-primary)] hover:underline"
          >
            Select all
          </button>
          <button type="button" onClick={clearAll} className="text-xs text-gray-500 hover:underline">
            Clear
          </button>
        </div>
      </div>

      {hint ? (
        <p className="px-3 py-1.5 text-[11px] text-gray-500 border-b border-gray-100 bg-white">
          {hint}
        </p>
      ) : null}

      {showImages && selectedCategories.length > 0 ? (
        <div className="px-3 py-2.5 border-b border-gray-200 bg-white">
          <p className="text-[11px] font-medium text-gray-500 mb-2">Carousel / selected order</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedCategories.map((cat, index) => (
              <div
                key={cat._id}
                className="flex flex-col items-center gap-1 shrink-0 w-[72px]"
                title={cat.name}
              >
                <div className="relative">
                  <CategoryThumb src={cat.icon} name={cat.name} size="lg" />
                  <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-[var(--theme-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <span className="text-[10px] text-gray-700 text-center line-clamp-2 w-full leading-tight">
                  {cat.name}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => moveSelected(cat._id, -1)}
                    aria-label="Move earlier in carousel"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    disabled={index === selectedCategories.length - 1}
                    onClick={() => moveSelected(cat._id, 1)}
                    aria-label="Move later in carousel"
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
        {categories.map((cat) => {
          const count = productCountForCategory(products, cat._id);
          const checked = selectedSet.has(cat._id);
          return (
            <label
              key={cat._id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                checked ? "bg-[color-mix(in_srgb,var(--theme-primary,#8B5E3C)_8%,white)]" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => toggle(cat._id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)]"
              />
              {showImages ? <CategoryThumb src={cat.icon} name={cat.name} size="md" /> : null}
              <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{cat.name}</span>
              <span className="text-xs text-gray-500 shrink-0">({count})</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
