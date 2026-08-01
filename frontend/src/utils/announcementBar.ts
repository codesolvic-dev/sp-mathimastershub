export type AnnouncementMessage = {
  text: string;
  link?: string;
  order?: number;
};

export type AnnouncementBarSettings = {
  enabled?: boolean;
  messages?: AnnouncementMessage[];
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
  autoRotate?: boolean;
  rotateIntervalSeconds?: number;
};

export const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarSettings = {
  enabled: false,
  messages: [
    {
      text: "Free shipping on orders over Rs. 5,000",
      link: "/shop",
      order: 0,
    },
  ],
  backgroundColor: "#000000",
  textColor: "#ffffff",
  dismissible: false,
  autoRotate: true,
  rotateIntervalSeconds: 5,
};

export const ANNOUNCEMENT_BAR_DISMISS_PREFIX = "announcement-bar-dismissed:";

export function normalizeAnnouncementBar(
  value?: AnnouncementBarSettings | null
): AnnouncementBarSettings {
  const messages = Array.isArray(value?.messages)
    ? value.messages
        .map((message, index) => ({
          text: String(message?.text || "").trim(),
          link: String(message?.link || "").trim(),
          order: Number.isFinite(message?.order) ? Number(message.order) : index,
        }))
        .filter((message) => message.text)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  return {
    ...DEFAULT_ANNOUNCEMENT_BAR,
    ...(value || {}),
    enabled: value?.enabled === true,
    messages: messages.length > 0 ? messages : DEFAULT_ANNOUNCEMENT_BAR.messages,
    backgroundColor: value?.backgroundColor?.trim() || "#000000",
    textColor: value?.textColor || DEFAULT_ANNOUNCEMENT_BAR.textColor,
    dismissible: value?.dismissible !== false,
    autoRotate: value?.autoRotate !== false,
    rotateIntervalSeconds: Math.max(
      3,
      Number(value?.rotateIntervalSeconds) || DEFAULT_ANNOUNCEMENT_BAR.rotateIntervalSeconds || 5
    ),
  };
}

export function getAnnouncementDismissKey(settings: AnnouncementBarSettings) {
  const payload = (settings.messages || [])
    .map((message) => `${message.text}|${message.link || ""}`)
    .join("||");
  return `${ANNOUNCEMENT_BAR_DISMISS_PREFIX}${payload}`;
}

export function isAnnouncementDismissed(settings: AnnouncementBarSettings) {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(getAnnouncementDismissKey(settings)) === "1";
  } catch {
    return false;
  }
}

export function dismissAnnouncementBar(settings: AnnouncementBarSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getAnnouncementDismissKey(settings), "1");
  } catch {
    // ignore
  }
}

export function setAnnouncementBarHeight(heightPx: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--announcement-bar-height",
    `${Math.max(0, heightPx)}px`
  );
}

export function isInternalAnnouncementLink(link?: string) {
  const value = String(link || "").trim();
  return value.startsWith("/") && !value.startsWith("//");
}
