import type { Plugin } from "vite";

/** Pull token from bare value or full <meta content="…"> paste. */
function parseGscToken(raw: unknown): string {
  const s = String(raw ?? "")
    .replace(/\u201c|\u201d|\u2018|\u2019/g, '"')
    .trim();
  if (!s) return "";
  const fromAttr =
    s.match(/content\s*=\s*["']([^"']+)["']/i) ||
    s.match(/content\s*=\s*([^\s/>]+)/i);
  const token = (fromAttr ? fromAttr[1] : s).trim().replace(/^["']|["']$/g, "");
  return token.replace(/[^\w.+\/=-]/g, "").slice(0, 200);
}

function resolveCompanyApiUrl(): string {
  const urls = String(process.env.VITE_API_URLS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const single = String(process.env.VITE_API_URL || "").trim();
  const raw = urls[0] || single || "http://localhost:3000/api";
  return raw.replace(/\/$/, "").endsWith("/api")
    ? raw.replace(/\/$/, "")
    : `${raw.replace(/\/$/, "")}/api`;
}

async function fetchGscToken(): Promise<string> {
  const api = resolveCompanyApiUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${api}/company`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return "";
    const json = (await res.json()) as { data?: { googleSiteVerification?: string } };
    return parseGscToken(json?.data?.googleSiteVerification);
  } catch {
    return "";
  }
}

const META_RE = /<meta\s+[^>]*name=["']google-site-verification["'][^>]*>/i;

/**
 * Injects Google Search Console verification meta into index.html at
 * dev-serve / build time so View Source and Googlebot see it (not only JS DOM).
 */
export function injectGoogleSiteVerificationMeta(): Plugin {
  return {
    name: "inject-google-site-verification-meta",
    async transformIndexHtml(html) {
      const token = await fetchGscToken();
      const tag = token
        ? `<meta name="google-site-verification" content="${token}" />`
        : `<!-- google-site-verification: set in Developer → Third-Party Services → Google Search Console -->`;

      if (META_RE.test(html)) {
        return html.replace(META_RE, tag);
      }
      if (html.includes("</title>")) {
        return html.replace("</title>", `</title>\n    ${tag}`);
      }
      return html.replace(/<head[^>]*>/i, (open) => `${open}\n    ${tag}`);
    },
  };
}
