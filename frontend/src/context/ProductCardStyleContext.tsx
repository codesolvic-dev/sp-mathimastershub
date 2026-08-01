import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { updateCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import { fetchCompanyShared } from "@/utils/companyFetch";

export type ProductCardStyleId = "1" | "2";

const STORAGE_KEY = "app_product_card_style";
export const PRODUCT_CARD_STYLE_EVENT = "product-card-style-changed";

type ProductCardStyleContextValue = {
  productCardStyle: ProductCardStyleId;
  setProductCardStyle: (style: ProductCardStyleId) => void;
  saveProductCardStyle: (style: ProductCardStyleId) => Promise<void>;
  saving: boolean;
};

const ProductCardStyleContext = createContext<ProductCardStyleContextValue | null>(null);

function normalizeStyle(raw: unknown): ProductCardStyleId {
  return String(raw || "").trim() === "2" ? "2" : "1";
}

function readStyleFromStorage(): ProductCardStyleId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "1" || v === "2") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStyleToStorage(style: ProductCardStyleId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(PRODUCT_CARD_STYLE_EVENT, { detail: { productCardStyle: style } })
  );
}

function readStyleFromCache(): ProductCardStyleId {
  const fromStorage = readStyleFromStorage();
  if (fromStorage) return fromStorage;
  const company = getCachedData<{ productCardStyle?: string }>(CACHE_KEYS.COMPANY);
  return normalizeStyle(company?.productCardStyle);
}

export function ProductCardStyleProvider({ children }: { children: React.ReactNode }) {
  const [productCardStyle, setProductCardStyleState] = useState<ProductCardStyleId>(() =>
    readStyleFromCache()
  );
  const [saving, setSaving] = useState(false);

  const applyStyle = useCallback((style: ProductCardStyleId, persistLocal = true) => {
    const next = normalizeStyle(style);
    setProductCardStyleState(next);
    if (persistLocal) writeStyleToStorage(next);
  }, []);

  const setProductCardStyle = useCallback(
    (style: ProductCardStyleId) => {
      applyStyle(style, true);
    },
    [applyStyle]
  );

  const saveProductCardStyle = useCallback(
    async (style: ProductCardStyleId) => {
      const next = normalizeStyle(style);
      applyStyle(next, true);
      setSaving(true);
      try {
        const updated = await updateCompany({ productCardStyle: next });
        const saved = normalizeStyle(updated?.productCardStyle ?? next);
        applyStyle(saved, true);
        setCompanyCache({
          ...(updated || {}),
          productCardStyle: saved,
        });
        if (saved !== next) {
          throw new Error("Server did not save product card style. Restart backend and try again.");
        }
      } catch (err) {
        // Keep local selection so UI/site still update; rethrow for toast
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [applyStyle]
  );

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      applyStyle(readStyleFromCache(), false);
      try {
        const company = await fetchCompanyShared();
        if (cancelled) return;
        // Prefer server when it has an explicit value; otherwise keep localStorage choice
        const serverRaw = company?.productCardStyle;
        const hasServer =
          serverRaw !== undefined && serverRaw !== null && String(serverRaw).trim() !== "";
        const next = hasServer
          ? normalizeStyle(serverRaw)
          : readStyleFromStorage() || normalizeStyle(serverRaw);
        applyStyle(next, true);
        if (company) setCompanyCache({ ...company, productCardStyle: next });
      } catch {
        /* keep current */
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [applyStyle]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return;
      applyStyle(normalizeStyle(e.newValue), false);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.productCardStyle) applyStyle(normalizeStyle(detail.productCardStyle), false);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PRODUCT_CARD_STYLE_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PRODUCT_CARD_STYLE_EVENT, onCustom as EventListener);
    };
  }, [applyStyle]);

  return (
    <ProductCardStyleContext.Provider
      value={{ productCardStyle, setProductCardStyle, saveProductCardStyle, saving }}
    >
      {children}
    </ProductCardStyleContext.Provider>
  );
}

export function useProductCardStyle(): ProductCardStyleContextValue {
  const ctx = useContext(ProductCardStyleContext);
  if (!ctx) {
    return {
      productCardStyle: readStyleFromCache(),
      setProductCardStyle: () => {},
      saveProductCardStyle: async () => {},
      saving: false,
    };
  }
  return ctx;
}
