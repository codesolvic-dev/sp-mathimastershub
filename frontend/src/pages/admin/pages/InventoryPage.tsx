import React, { useCallback, useEffect, useMemo, useState } from "react";
import EnhancedDataTable from "../components/table/EnhancedDataTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { getProducts, updateProduct } from "@/api/product.api";
import { getPusher } from "@/lib/pusher";
import { removeCachedData, CACHE_KEYS } from "@/utils/cache";
import { Warehouse, AlertTriangle, RefreshCw } from "lucide-react";

type ProductVariant = {
  color?: string;
  size?: string;
  customValue?: string;
  price?: number;
  stock?: number;
  sku?: string;
  purchaseRate?: number;
  oldUnits?: number;
};

type InventoryProduct = {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  status: "active" | "inactive";
  hasVariations?: boolean;
  stock?: number;
  sku?: string;
  purchaseRate?: number;
  oldUnits?: number;
  variants?: ProductVariant[];
  image1?: string;
};

type InventoryRow = {
  id: string;
  key: string;
  productId: string;
  name: string;
  variation: string;
  image?: string;
  sku: string;
  unavailable: number;
  committed: number;
  available: number;
  onHand: number;
  incoming: number;
  purchaseRate: number;
  oldUnits: number;
  salePrice: number;
  profitPerUnit: number;
  totalProfit: number;
  hasVariations: boolean;
  variantIndex?: number;
};

function variantLabel(v: ProductVariant): string {
  const parts = [v.color, v.size, v.customValue].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Default";
}

function salePriceAfterDiscount(price: number, discount?: number): number {
  const base = Number(price) || 0;
  const pct = Number(discount) || 0;
  if (pct <= 0) return base;
  return Math.max(0, base * (1 - pct / 100));
}

type RowMetrics = {
  onHand: number;
  purchaseRate: number;
  salePrice: number;
  available: number;
  profitPerUnit: number;
  totalProfit: number;
  totalCost: number;
};

function computeRowMetrics(
  row: InventoryRow,
  products: InventoryProduct[],
  stockDraft: Record<string, number>,
  purchaseDraft: Record<string, number>
): RowMetrics {
  const onHand = Math.max(0, Number(stockDraft[row.key] ?? row.onHand) || 0);
  const purchaseRate = Math.max(0, Number(purchaseDraft[row.key] ?? row.purchaseRate) || 0);
  const product = products.find((p) => p._id === row.productId);
  const salePrice = salePriceAfterDiscount(row.salePrice, product?.discount);
  const available = Math.max(0, onHand - row.unavailable - row.committed);
  const profitPerUnit = salePrice - purchaseRate;
  const totalProfit = profitPerUnit * available;
  const totalCost = purchaseRate * onHand;

  return {
    onHand,
    purchaseRate,
    salePrice,
    available,
    profitPerUnit,
    totalProfit,
    totalCost,
  };
}

function buildInventoryRow(
  p: InventoryProduct,
  opts: {
    key: string;
    variation: string;
    onHand: number;
    sku: string;
    purchaseRate: number;
    oldUnits: number;
    salePrice: number;
    hasVariations: boolean;
    variantIndex?: number;
  }
): InventoryRow {
  const unavailable = 0;
  const committed = 0;
  const onHand = opts.onHand;
  const available = Math.max(0, onHand - unavailable - committed);
  const profitPerUnit = salePriceAfterDiscount(opts.salePrice, p.discount) - (opts.purchaseRate || 0);

  return {
    id: opts.key,
    key: opts.key,
    productId: p._id,
    name: p.name,
    variation: opts.variation,
    image: p.image1,
    sku: opts.sku?.trim() || "",
    unavailable,
    committed,
    available,
    onHand,
    incoming: 0,
    purchaseRate: opts.purchaseRate || 0,
    oldUnits: opts.oldUnits || 0,
    salePrice: opts.salePrice,
    profitPerUnit,
    totalProfit: profitPerUnit * available,
    hasVariations: opts.hasVariations,
    variantIndex: opts.variantIndex,
  };
}

function normalizeProduct(p: InventoryProduct & { id?: string }): InventoryProduct {
  return {
    ...p,
    _id: String(p._id || p.id || ""),
  };
}

function buildRows(products: InventoryProduct[]): InventoryRow[] {
  const rows: InventoryRow[] = [];
  for (const raw of products) {
    const p = normalizeProduct(raw);
    if (!p._id) continue;
    if (p.hasVariations && p.variants?.length) {
      p.variants.forEach((v, idx) => {
        const onHand = Number(v.stock) || 0;
        rows.push(
          buildInventoryRow(p, {
            key: `${p._id}-${idx}`,
            variation: variantLabel(v),
            onHand,
            sku: v.sku || "",
            purchaseRate: Number(v.purchaseRate) || 0,
            oldUnits: Number(v.oldUnits) || 0,
            salePrice: Number(v.price) > 0 ? Number(v.price) : Number(p.price) || 0,
            hasVariations: true,
            variantIndex: idx,
          })
        );
      });
    } else {
      const onHand = Number(p.stock) || 0;
      rows.push(
        buildInventoryRow(p, {
          key: p._id,
          variation: "—",
          onHand,
          sku: p.sku || "",
          purchaseRate: Number(p.purchaseRate) || 0,
          oldUnits: Number(p.oldUnits) || 0,
          salePrice: Number(p.price) || 0,
          hasVariations: false,
        })
      );
    }
  }
  return rows;
}

export default function InventoryPage() {
  const { formatMoney } = useStoreCurrency();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [stockDraft, setStockDraft] = useState<Record<string, number>>({});
  const [purchaseDraft, setPurchaseDraft] = useState<Record<string, number>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const loadProducts = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    else setRefreshing(true);
    try {
      const list = (await getProducts({ fresh: true })).map(normalizeProduct);
      setProducts(list);
      const stock: Record<string, number> = {};
      const purchase: Record<string, number> = {};
      buildRows(list).forEach((row) => {
        stock[row.key] = row.onHand;
        purchase[row.key] = row.purchaseRate;
      });
      setStockDraft(stock);
      setPurchaseDraft(purchase);
      removeCachedData(CACHE_KEYS.PRODUCTS);
    } catch (err) {
      console.error(err);
      if (!options?.silent) error("Failed to load inventory.");
    } finally {
      if (!options?.silent) setLoading(false);
      setRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        loadProducts({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadProducts]);

  // Live refresh when a new order is placed (stock deducted on backend)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const pusher = getPusher();
    const channel = pusher.subscribe("admin-notifications");
    const onNewOrder = () => {
      loadProducts({ silent: true });
    };
    channel.bind("new-order", onNewOrder);

    return () => {
      channel.unbind("new-order", onNewOrder);
    };
  }, [loadProducts]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rows = useMemo(() => buildRows(products), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.variation.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    let low = 0;
    let out = 0;
    let soldOut = 0;
    let totalProfit = 0;
    let totalOnHand = 0;
    let totalCost = 0;

    for (const r of rows) {
      const m = computeRowMetrics(r, products, stockDraft, purchaseDraft);
      totalOnHand += m.onHand;
      totalCost += m.totalCost;
      totalProfit += m.totalProfit;

      // Items Sold Out = Total stock − Current stock
      const totalStock = Math.max(Number(r.oldUnits) || 0, m.onHand);
      soldOut += Math.max(0, totalStock - m.onHand);

      if (m.onHand <= 0) out += 1;
      else if (m.onHand <= 5) low += 1;
    }

    return { low, out, soldOut, totalProfit, totalOnHand, totalCost };
  }, [rows, stockDraft, purchaseDraft, products]);

  const saveRow = useCallback(async (row: InventoryRow) => {
    const nextStock = Math.max(0, Number(stockDraft[row.key]) || 0);
    const nextPurchase = Math.max(0, Number(purchaseDraft[row.key]) || 0);
    const stockChanged = nextStock !== row.onHand;
    // oldUnits = total/baseline stock (sold = oldUnits − on hand)
    const baseline = Math.max(Number(row.oldUnits) || 0, row.onHand);
    const nextOldUnits = !stockChanged
      ? row.oldUnits
      : nextStock > row.onHand
        ? baseline + (nextStock - row.onHand) // restock increases total stock
        : baseline;

    setSavingKey(row.key);
    try {
      const product = products.find((p) => p._id === row.productId);
      if (!product) return;

      if (row.hasVariations && row.variantIndex != null) {
        const variants = [...(product.variants || [])];
        const prev = variants[row.variantIndex];
        variants[row.variantIndex] = {
          ...prev,
          stock: nextStock,
          purchaseRate: nextPurchase,
          oldUnits: nextOldUnits,
        };
        await updateProduct(row.productId, {
          hasVariations: true,
          variants,
        });
      } else {
        await updateProduct(row.productId, {
          stock: nextStock,
          purchaseRate: nextPurchase,
          oldUnits: nextOldUnits,
        });
      }

      success("Inventory updated.");
      removeCachedData(CACHE_KEYS.PRODUCTS);
      await loadProducts({ silent: true });
    } catch (err) {
      console.error(err);
      error("Failed to update inventory.");
    } finally {
      setSavingKey(null);
    }
  }, [stockDraft, purchaseDraft, products, success, error, loadProducts]);

  const columns = useMemo(() => {
    const profitForRow = (row: InventoryRow) => {
      const m = computeRowMetrics(row, products, stockDraft, purchaseDraft);
      return { perUnit: m.profitPerUnit, total: m.totalProfit, available: m.available };
    };

    const all = [
      {
        name: "Product",
        minWidth: "240px",
        cell: (row: InventoryRow) => (
          <div className="flex items-center gap-3 py-1 min-w-0">
            <img
              src={row.image || "/product.png"}
              alt={row.name}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{row.name}</div>
              {row.variation !== "—" && (
                <div className="text-xs text-gray-500 truncate">{row.variation}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        name: "SKU",
        minWidth: "100px",
        cell: (row: InventoryRow) => (
          <span className="text-sm text-gray-600">{row.sku || "No SKU"}</span>
        ),
      },
      {
        name: "Unavailable",
        minWidth: "90px",
        cell: (row: InventoryRow) => <span className="text-gray-700">{row.unavailable}</span>,
      },
      {
        name: "Committed",
        minWidth: "90px",
        cell: (row: InventoryRow) => <span className="text-gray-700">{row.committed}</span>,
      },
      {
        name: "Available",
        minWidth: "90px",
        cell: (row: InventoryRow) => {
          const { available } = profitForRow(row);
          return <span className="font-medium text-gray-900">{available}</span>;
        },
      },
      {
        name: "On hand",
        minWidth: "100px",
        cell: (row: InventoryRow) => (
          <Input
            type="number"
            min={0}
            value={stockDraft[row.key] ?? row.onHand}
            onChange={(e) =>
              setStockDraft((prev) => ({
                ...prev,
                [row.key]: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className="w-20 h-9"
          />
        ),
      },
      {
        name: "Incoming",
        minWidth: "85px",
        cell: (row: InventoryRow) => <span className="text-gray-700">{row.incoming}</span>,
      },
      {
        name: "Purchase rate",
        minWidth: "120px",
        cell: (row: InventoryRow) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={purchaseDraft[row.key] ?? row.purchaseRate}
            onChange={(e) =>
              setPurchaseDraft((prev) => ({
                ...prev,
                [row.key]: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className="w-24 h-9"
          />
        ),
      },
      {
        name: "Total stock",
        minWidth: "95px",
        cell: (row: InventoryRow) => {
          const onHand = stockDraft[row.key] ?? row.onHand;
          const totalStock = Math.max(Number(row.oldUnits) || 0, onHand);
          return (
            <span className="text-gray-600" title="Baseline / total stock for sold calculation">
              {totalStock}
            </span>
          );
        },
      },
      {
        name: "Sold",
        minWidth: "80px",
        cell: (row: InventoryRow) => {
          const onHand = stockDraft[row.key] ?? row.onHand;
          const totalStock = Math.max(Number(row.oldUnits) || 0, onHand);
          const sold = Math.max(0, totalStock - onHand);
          return <span className="font-medium text-orange-700">{sold}</span>;
        },
      },
      {
        name: "Profit / unit",
        minWidth: "110px",
        cell: (row: InventoryRow) => {
          const { perUnit } = profitForRow(row);
          return (
            <span className={perUnit >= 0 ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
              {formatMoney(perUnit)}
            </span>
          );
        },
      },
      {
        name: "Total profit",
        minWidth: "110px",
        cell: (row: InventoryRow) => {
          const { total } = profitForRow(row);
          return (
            <span className={total >= 0 ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}>
              {formatMoney(total)}
            </span>
          );
        },
      },
      {
        name: "",
        minWidth: "88px",
        cell: (row: InventoryRow) => (
          <Button
            size="sm"
            className="theme-button text-white"
            disabled={savingKey === row.key}
            onClick={() => saveRow(row)}
          >
            {savingKey === row.key ? "…" : "Save"}
          </Button>
        ),
      },
    ];

    if (windowWidth < 900) {
      return all.filter((_, i) => [0, 5, 7, 8, 9, 12].includes(i));
    }
    if (windowWidth < 1200) {
      return all.filter((_, i) => ![2, 3, 6].includes(i));
    }
    return all;
  }, [stockDraft, purchaseDraft, savingKey, windowWidth, products, formatMoney, saveRow]);

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold theme-heading flex items-center gap-2">
              <Warehouse className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
              Inventory
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track stock, purchase rate, and profit — Shopify style
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => loadProducts({ silent: true })}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 min-w-[120px]">
            <span className="text-gray-500">On hand (total)</span>
            <div className="font-bold text-gray-900">{summary.totalOnHand.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 min-w-[120px]">
            <span className="text-slate-600">Inventory cost</span>
            <div className="font-bold text-slate-800">{formatMoney(summary.totalCost)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">purchase rate × on hand</div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 min-w-[120px]">
            <span className="text-emerald-700">Est. profit</span>
            <div className="font-bold text-emerald-800">{formatMoney(summary.totalProfit)}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">(sale − purchase) × available</div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 min-w-[100px]">
            <span className="text-orange-700">Items Sold Out</span>
            <div className="font-bold text-orange-800">{summary.soldOut.toLocaleString()}</div>
            <div className="text-[10px] text-orange-600 mt-0.5">total − current stock</div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 min-w-[100px]">
            <span className="text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low stock
            </span>
            <div className="font-bold text-amber-800">{summary.low}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">1–5 units</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 min-w-[100px]">
            <span className="text-red-700">Out of stock</span>
            <div className="font-bold text-red-800">{summary.out}</div>
            <div className="text-[10px] text-red-500 mt-0.5">0 units</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search product, variation, or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          {rows.length === 0
            ? "No products yet. Add products first, then manage inventory here."
            : "No products match your search."}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <EnhancedDataTable<InventoryRow>
            columns={columns}
            data={filtered}
            pagination
          />
        </div>
      )}
    </div>
  );
}
