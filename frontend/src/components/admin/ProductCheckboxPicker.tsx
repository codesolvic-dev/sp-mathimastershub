import React, { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/api/product.api";
import {
  parseCategorySelectionCsv,
  packCategorySelectionCsv,
} from "@/utils/landingSectionContent";
import CircularLoader from "@/components/ui/CircularLoader";

type ProductRow = {
  _id: string;
  name: string;
  image1?: string;
  video1?: string;
  video2?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** Only list products that have at least one video URL */
  videosOnly?: boolean;
};

function Thumb({ src, name }: { src?: string; name: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 shrink-0">
        {(name?.charAt(0) || "?").toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
      onError={() => setBroken(true)}
    />
  );
}

/** Multi-select products (stores comma-separated IDs). */
export default function ProductCheckboxPicker({
  value,
  onChange,
  hint,
  videosOnly = true,
}: Props) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const selectedIds = useMemo(() => parseCategorySelectionCsv(value), [value]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts({ activeOnly: true })
      .then((list) => {
        if (cancelled) return;
        const rows = (Array.isArray(list) ? list : [])
          .filter((p: any) => p?._id && p?.name)
          .map((p: any) => ({
            _id: String(p._id),
            name: String(p.name),
            image1: typeof p.image1 === "string" ? p.image1 : "",
            video1: typeof p.video1 === "string" ? p.video1 : "",
            video2: typeof p.video2 === "string" ? p.video2 : "",
          }));
        setProducts(rows);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    let list = products;
    if (videosOnly) {
      list = list.filter((p) => Boolean((p.video1 || "").trim() || (p.video2 || "").trim()));
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [products, videosOnly, query]);

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(packCategorySelectionCsv(selectedIds.filter((x) => x !== id)));
    } else {
      onChange(packCategorySelectionCsv([...selectedIds, id]));
    }
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = selectedIds.indexOf(id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= selectedIds.length) return;
    const copy = [...selectedIds];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange(packCategorySelectionCsv(copy));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <CircularLoader size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
      />
      <p className="text-xs text-gray-500">
        {selectedIds.length} selected
        {videosOnly ? " · showing products with Video 1 / Video 2 (YouTube or PC upload)" : ""}
      </p>
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
          {selectedIds.map((id) => {
            const p = products.find((x) => x._id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-800"
              >
                {p?.name || id.slice(-6)}
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => move(id, -1)}
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => move(id, 1)}
                  aria-label="Move later"
                >
                  →
                </button>
                <button
                  type="button"
                  className="text-gray-500 hover:text-red-600 ml-0.5"
                  onClick={() => toggle(id)}
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {visible.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 text-center">
            {videosOnly
              ? "No products with videos yet. In Admin → Products, add Video 1 via YouTube URL or Select from PC."
              : "No products found."}
          </p>
        ) : (
          visible.map((p) => {
            const checked = selectedSet.has(p._id);
            const hasVid = Boolean((p.video1 || "").trim() || (p.video2 || "").trim());
            return (
              <label
                key={p._id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${
                  checked ? "bg-[var(--theme-light)]/30" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p._id)}
                  className="rounded border-gray-300"
                />
                <Thumb src={p.image1} name={p.name} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900 truncate">{p.name}</span>
                  <span className="block text-[11px] text-gray-500">
                    {hasVid ? "Has video" : "No video"}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
