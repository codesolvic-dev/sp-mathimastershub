export type MaintenanceBackgroundMode = "color" | "image" | "gradient";

export type MaintenanceSocialKey = "facebook" | "instagram" | "twitter" | "linkedin";

export type MaintenanceModeSettings = {
  enabled: boolean;
  title: string;
  titleColor: string;
  titleFontSize: number;
  message: string;
  messageColor: string;
  messageFontSize: number;
  footerText: string;
  footerTextColor: string;
  footerFontSize: number;
  estimatedReturn: string;
  backgroundMode: MaintenanceBackgroundMode;
  backgroundColor: string;
  backgroundColorSecondary: string;
  backgroundImage: string;
  backgroundBlur: number;
  overlayColor: string;
  overlayOpacity: number;
  textColor: string;
  accentColor: string;
  showLogo: boolean;
  logoMaxWidth: number;
  showContact: boolean;
  contactEmail: string;
  contactPhone: string;
  showButton: boolean;
  buttonLabel: string;
  buttonLink: string;
  buttonColor: string;
  buttonTextColor: string;
  showCountdown: boolean;
  countdownEndsAt: string;
  showSocial: boolean;
  socialFacebook: boolean;
  socialInstagram: boolean;
  socialTwitter: boolean;
  socialLinkedin: boolean;
  /** Access Settings */
  allowAdminAccess: boolean;
  allowDeveloperAccess: boolean;
  allowAuthPages: boolean;
  customExemptPaths: string;
  /** SEO */
  seoTitle: string;
  seoDescription: string;
  seoNoIndex: boolean;
  /** Advanced */
  customCss: string;
  redirectUrl: string;
};

export const DEFAULT_MAINTENANCE_MODE: MaintenanceModeSettings = {
  enabled: false,
  title: "We'll Be Back Soon!",
  titleColor: "#FFFFEF",
  titleFontSize: 48,
  message:
    "We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly.",
  messageColor: "#E2E8F0",
  messageFontSize: 20,
  footerText: "© 2026 Your Website. All Rights Reserved.",
  footerTextColor: "#94A3B8",
  footerFontSize: 14,
  estimatedReturn: "",
  backgroundMode: "image",
  backgroundColor: "#0f172a",
  backgroundColorSecondary: "#1e293b",
  backgroundImage: "",
  backgroundBlur: 0,
  overlayColor: "#0B1220",
  overlayOpacity: 0.6,
  textColor: "#ffffff",
  accentColor: "#3B82F6",
  showLogo: true,
  logoMaxWidth: 250,
  showContact: true,
  contactEmail: "",
  contactPhone: "",
  showButton: true,
  buttonLabel: "Notify Me",
  buttonLink: "",
  buttonColor: "#3B82F6",
  buttonTextColor: "#FFFFFF",
  showCountdown: true,
  countdownEndsAt: "",
  showSocial: true,
  socialFacebook: true,
  socialInstagram: true,
  socialTwitter: true,
  socialLinkedin: true,
  allowAdminAccess: true,
  allowDeveloperAccess: true,
  allowAuthPages: true,
  customExemptPaths: "",
  seoTitle: "Under Maintenance",
  seoDescription: "We're currently performing scheduled maintenance. Please check back soon.",
  seoNoIndex: true,
  customCss: "",
  redirectUrl: "",
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function normalizeMaintenanceMode(
  value?: Partial<MaintenanceModeSettings> | null
): MaintenanceModeSettings {
  const merged = {
    ...DEFAULT_MAINTENANCE_MODE,
    ...(value || {}),
  };
  const mode = String(merged.backgroundMode || "color");
  return {
    ...merged,
    enabled: merged.enabled === true,
    showLogo: merged.showLogo !== false,
    showContact: merged.showContact !== false,
    showButton: merged.showButton !== false,
    showCountdown: merged.showCountdown === true,
    showSocial: merged.showSocial !== false,
    socialFacebook: merged.socialFacebook !== false,
    socialInstagram: merged.socialInstagram !== false,
    socialTwitter: merged.socialTwitter !== false,
    socialLinkedin: merged.socialLinkedin !== false,
    allowAdminAccess: merged.allowAdminAccess !== false,
    allowDeveloperAccess: merged.allowDeveloperAccess !== false,
    allowAuthPages: merged.allowAuthPages !== false,
    seoNoIndex: merged.seoNoIndex !== false,
    backgroundMode: (["color", "image", "gradient"].includes(mode)
      ? mode
      : "color") as MaintenanceBackgroundMode,
    backgroundBlur: clamp(Number(merged.backgroundBlur) || 0, 0, 40),
    overlayOpacity: clamp(Number(merged.overlayOpacity) || 0, 0, 1),
    titleFontSize: clamp(Number(merged.titleFontSize) || 48, 20, 72),
    messageFontSize: clamp(Number(merged.messageFontSize) || 20, 12, 36),
    footerFontSize: clamp(Number(merged.footerFontSize) || 14, 10, 24),
    logoMaxWidth: clamp(Number(merged.logoMaxWidth) || 250, 80, 480),
    title: String(merged.title || DEFAULT_MAINTENANCE_MODE.title),
    titleColor: String(merged.titleColor || DEFAULT_MAINTENANCE_MODE.titleColor),
    message: String(merged.message || DEFAULT_MAINTENANCE_MODE.message),
    messageColor: String(merged.messageColor || DEFAULT_MAINTENANCE_MODE.messageColor),
    footerText: String(merged.footerText || ""),
    footerTextColor: String(merged.footerTextColor || DEFAULT_MAINTENANCE_MODE.footerTextColor),
    estimatedReturn: String(merged.estimatedReturn || ""),
    backgroundColor: String(merged.backgroundColor || DEFAULT_MAINTENANCE_MODE.backgroundColor),
    backgroundColorSecondary: String(
      merged.backgroundColorSecondary || DEFAULT_MAINTENANCE_MODE.backgroundColorSecondary
    ),
    backgroundImage: String(merged.backgroundImage || ""),
    overlayColor: String(merged.overlayColor || DEFAULT_MAINTENANCE_MODE.overlayColor),
    textColor: String(merged.textColor || DEFAULT_MAINTENANCE_MODE.textColor),
    accentColor: String(merged.accentColor || DEFAULT_MAINTENANCE_MODE.accentColor),
    contactEmail: String(merged.contactEmail || ""),
    contactPhone: String(merged.contactPhone || ""),
    buttonLabel: String(merged.buttonLabel || ""),
    buttonLink: String(merged.buttonLink || ""),
    buttonColor: String(merged.buttonColor || DEFAULT_MAINTENANCE_MODE.buttonColor),
    buttonTextColor: String(merged.buttonTextColor || DEFAULT_MAINTENANCE_MODE.buttonTextColor),
    countdownEndsAt: String(merged.countdownEndsAt || ""),
    customExemptPaths: String(merged.customExemptPaths || ""),
    seoTitle: String(merged.seoTitle || DEFAULT_MAINTENANCE_MODE.seoTitle),
    seoDescription: String(merged.seoDescription || DEFAULT_MAINTENANCE_MODE.seoDescription),
    customCss: String(merged.customCss || ""),
    redirectUrl: String(merged.redirectUrl || ""),
  };
}

export function resolveMaintenanceImageUrl(url?: string | null): string {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("http")) {
    return value;
  }
  if (value.startsWith("/")) return value;
  return value;
}

export function getCountdownParts(endsAt: string, now = Date.now()) {
  const end = new Date(endsAt).getTime();
  if (!endsAt || Number.isNaN(end)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Paths that stay reachable while maintenance mode is on (staff / auth). */
export function isMaintenanceExemptPath(
  pathname: string,
  settings?: Pick<
    MaintenanceModeSettings,
    "allowAdminAccess" | "allowDeveloperAccess" | "allowAuthPages" | "customExemptPaths"
  > | null
): boolean {
  const path = (pathname || "/").toLowerCase();
  const cfg = settings || DEFAULT_MAINTENANCE_MODE;

  if (cfg.allowDeveloperAccess !== false && path.startsWith("/developer")) return true;
  if (cfg.allowAdminAccess !== false && path.startsWith("/admin")) return true;
  if (
    cfg.allowAuthPages !== false &&
    (path.startsWith("/login") ||
      path.startsWith("/access") ||
      path.startsWith("/forgot") ||
      path.startsWith("/reset-password"))
  ) {
    return true;
  }

  const extras = String(cfg.customExemptPaths || "")
    .split(/[\n,]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
    .map((p) => (p.startsWith("/") ? p : `/${p}`));
  return extras.some((p) => path === p || path.startsWith(`${p}/`));
}
