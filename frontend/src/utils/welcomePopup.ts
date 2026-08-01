export type WelcomePopupSettings = {
  enabled?: boolean;
  title?: string;
  description?: string;
  buttonLabel?: string;
  imageUrl?: string;
};

export const DEFAULT_WELCOME_POPUP: WelcomePopupSettings = {
  enabled: false,
  title: "",
  description: "",
  buttonLabel: "Continue",
  imageUrl: "",
};

export const WELCOME_POPUP_DISMISS_KEY = "welcome-popup-dismissed";

export function normalizeWelcomePopup(
  value?: WelcomePopupSettings | null,
  companyName?: string
): WelcomePopupSettings {
  const title = String(value?.title || "").trim() || (companyName ? `Welcome to ${companyName}` : "Welcome");
  const description =
    String(value?.description || "").trim() ||
    "Unlock exclusive offers and enjoy a premium shopping experience.";
  return {
    ...DEFAULT_WELCOME_POPUP,
    ...(value || {}),
    enabled: value?.enabled === true,
    title,
    description,
    buttonLabel: String(value?.buttonLabel || "Continue").trim() || "Continue",
    imageUrl: String(value?.imageUrl || "").trim(),
  };
}

export function resolveWelcomePopupImageUrl(imageUrl?: string) {
  const raw = String(imageUrl || "").trim();
  if (!raw || raw.startsWith("data:")) return "";
  if (raw.startsWith("http")) return raw;
  const urls = (import.meta.env.VITE_API_URLS || "")
    .split(",")
    .map((u: string) => u.trim())
    .filter(Boolean);
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const apiUrl = urls.length
    ? isLocalhost
      ? urls[0]
      : urls[1] || urls[0]
    : import.meta.env.VITE_API_URL || "";
  const base = apiUrl ? String(apiUrl).replace("/api", "") : "";
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

export function isWelcomePopupDismissed() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(WELCOME_POPUP_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissWelcomePopup() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(WELCOME_POPUP_DISMISS_KEY, "1");
  } catch {
    // ignore
  }
}
