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

export type ProductDetailStyleId = "1" | "2";

const STORAGE_KEY = "app_product_detail_style";
export const PRODUCT_DETAIL_STYLE_EVENT = "product-detail-style-changed";

type ProductDetailStyleContextValue = {
  productDetailStyle: ProductDetailStyleId;
  setProductDetailStyle: (style: ProductDetailStyleId) => void;
  saveProductDetailStyle: (style: ProductDetailStyleId) => Promise<void>;
  saving: boolean;
};

const ProductDetailStyleContext = createContext<ProductDetailStyleContextValue | null>(null);

function normalizeStyle(raw: unknown): ProductDetailStyleId {
  return String(raw || "").trim() === "2" ? "2" : "1";
}

function readStyleFromStorage(): ProductDetailStyleId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "1" || v === "2") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStyleToStorage(style: ProductDetailStyleId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(PRODUCT_DETAIL_STYLE_EVENT, { detail: { productDetailStyle: style } })
  );
}

function readStyleFromCache(): ProductDetailStyleId {
  const fromStorage = readStyleFromStorage();
  if (fromStorage) return fromStorage;
  const company = getCachedData<{ productDetailStyle?: string }>(CACHE_KEYS.COMPANY);
  return normalizeStyle(company?.productDetailStyle);
}

export function ProductDetailStyleProvider({ children }: { children: React.ReactNode }) {
  const [productDetailStyle, setProductDetailStyleState] = useState<ProductDetailStyleId>(() =>
    readStyleFromCache()
  );
  const [saving, setSaving] = useState(false);

  const applyStyle = useCallback((style: ProductDetailStyleId, persistLocal = true) => {
    const next = normalizeStyle(style);
    setProductDetailStyleState(next);
    if (persistLocal) writeStyleToStorage(next);
  }, []);

  const setProductDetailStyle = useCallback(
    (style: ProductDetailStyleId) => {
      applyStyle(style, true);
    },
    [applyStyle]
  );

  const saveProductDetailStyle = useCallback(
    async (style: ProductDetailStyleId) => {
      const next = normalizeStyle(style);
      applyStyle(next, true);
      setSaving(true);
      try {
        const updated = await updateCompany({ productDetailStyle: next });
        const saved = normalizeStyle(updated?.productDetailStyle ?? next);
        applyStyle(saved, true);
        setCompanyCache({
          ...(updated || {}),
          productDetailStyle: saved,
        });
        if (saved !== next) {
          throw new Error("Server did not save product detail style. Restart backend and try again.");
        }
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
        const serverRaw = company?.productDetailStyle;
        const hasServer =
          serverRaw !== undefined && serverRaw !== null && String(serverRaw).trim() !== "";
        const next = hasServer
          ? normalizeStyle(serverRaw)
          : readStyleFromStorage() || normalizeStyle(serverRaw);
        applyStyle(next, true);
        if (company) setCompanyCache({ ...company, productDetailStyle: next });
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
      if (detail?.productDetailStyle) applyStyle(normalizeStyle(detail.productDetailStyle), false);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(PRODUCT_DETAIL_STYLE_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(PRODUCT_DETAIL_STYLE_EVENT, onCustom as EventListener);
    };
  }, [applyStyle]);

  return (
    <ProductDetailStyleContext.Provider
      value={{ productDetailStyle, setProductDetailStyle, saveProductDetailStyle, saving }}
    >
      {children}
    </ProductDetailStyleContext.Provider>
  );
}

export function useProductDetailStyle(): ProductDetailStyleContextValue {
  const ctx = useContext(ProductDetailStyleContext);
  if (!ctx) {
    return {
      productDetailStyle: readStyleFromCache(),
      setProductDetailStyle: () => {},
      saveProductDetailStyle: async () => {},
      saving: false,
    };
  }
  return ctx;
}
