/**
 * Navigate the top-level app window (never an iframe).
 * Custom HTML sections run in iframes — links must leave the iframe or
 * /shop loads inside it and shows a second navbar on the home page.
 */
export function navigateApp(path: string): void {
  const raw = String(path || "").trim();
  if (!raw) return;

  let target = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      if (url.origin === window.location.origin) {
        target = `${url.pathname}${url.search}${url.hash}` || "/";
      } else {
        window.location.assign(raw);
        return;
      }
    } else if (!raw.startsWith("/")) {
      target = `/${raw}`;
    }
  } catch {
    target = raw.startsWith("/") ? raw : `/${raw}`;
  }

  try {
    if (window.top && window.top !== window.self) {
      window.top.location.assign(target);
      return;
    }
  } catch {
    /* cross-origin top — fall through */
  }

  window.location.assign(target);
}
