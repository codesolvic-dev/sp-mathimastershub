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

export type BlogCardStyleId = "1" | "2";

const STORAGE_KEY = "app_blog_card_style";
export const BLOG_CARD_STYLE_EVENT = "blog-card-style-changed";

type BlogCardStyleContextValue = {
  blogCardStyle: BlogCardStyleId;
  setBlogCardStyle: (style: BlogCardStyleId) => void;
  saveBlogCardStyle: (style: BlogCardStyleId) => Promise<void>;
  saving: boolean;
};

const BlogCardStyleContext = createContext<BlogCardStyleContextValue | null>(null);

function normalizeStyle(raw: unknown): BlogCardStyleId {
  return String(raw || "").trim() === "2" ? "2" : "1";
}

function readStyleFromStorage(): BlogCardStyleId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "1" || v === "2") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStyleToStorage(style: BlogCardStyleId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(BLOG_CARD_STYLE_EVENT, { detail: { blogCardStyle: style } })
  );
}

function readStyleFromCache(): BlogCardStyleId {
  const fromStorage = readStyleFromStorage();
  if (fromStorage) return fromStorage;
  const company = getCachedData<{ blogCardStyle?: string }>(CACHE_KEYS.COMPANY);
  return normalizeStyle(company?.blogCardStyle);
}

export function BlogCardStyleProvider({ children }: { children: React.ReactNode }) {
  const [blogCardStyle, setBlogCardStyleState] = useState<BlogCardStyleId>(() =>
    readStyleFromCache()
  );
  const [saving, setSaving] = useState(false);

  const applyStyle = useCallback((style: BlogCardStyleId, persistLocal = true) => {
    const next = normalizeStyle(style);
    setBlogCardStyleState(next);
    if (persistLocal) writeStyleToStorage(next);
  }, []);

  const setBlogCardStyle = useCallback(
    (style: BlogCardStyleId) => {
      applyStyle(style, true);
    },
    [applyStyle]
  );

  const saveBlogCardStyle = useCallback(
    async (style: BlogCardStyleId) => {
      const next = normalizeStyle(style);
      applyStyle(next, true);
      setSaving(true);
      try {
        const updated = await updateCompany({ blogCardStyle: next });
        const saved = normalizeStyle(updated?.blogCardStyle ?? next);
        applyStyle(saved, true);
        setCompanyCache({
          ...(updated || {}),
          blogCardStyle: saved,
        });
        if (saved !== next) {
          throw new Error("Server did not save blog card style. Restart backend and try again.");
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
        const serverRaw = company?.blogCardStyle;
        const hasServer =
          serverRaw !== undefined && serverRaw !== null && String(serverRaw).trim() !== "";
        const next = hasServer
          ? normalizeStyle(serverRaw)
          : readStyleFromStorage() || normalizeStyle(serverRaw);
        applyStyle(next, true);
        if (company) setCompanyCache({ ...company, blogCardStyle: next });
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
      if (detail?.blogCardStyle) applyStyle(normalizeStyle(detail.blogCardStyle), false);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(BLOG_CARD_STYLE_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BLOG_CARD_STYLE_EVENT, onCustom as EventListener);
    };
  }, [applyStyle]);

  return (
    <BlogCardStyleContext.Provider
      value={{ blogCardStyle, setBlogCardStyle, saveBlogCardStyle, saving }}
    >
      {children}
    </BlogCardStyleContext.Provider>
  );
}

export function useBlogCardStyle(): BlogCardStyleContextValue {
  const ctx = useContext(BlogCardStyleContext);
  if (!ctx) {
    return {
      blogCardStyle: readStyleFromCache(),
      setBlogCardStyle: () => {},
      saveBlogCardStyle: async () => {},
      saving: false,
    };
  }
  return ctx;
}
