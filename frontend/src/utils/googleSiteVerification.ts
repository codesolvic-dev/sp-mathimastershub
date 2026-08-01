/**
 * Google Search Console HTML-tag verification.
 * Accepts either the bare content token or a full <meta …> snippet.
 */

const META_NAME = "google-site-verification";

/** Tokens are usually alphanumeric; allow common base64-ish chars Google may use. */
const TOKEN_CHARS = /[^\w.+\/=-]/g;

/**
 * Extract verification content from a bare token or a full meta tag paste
 * (including smart quotes / multiline HTML from Google).
 */
export function parseGoogleSiteVerificationInput(raw: unknown): string {
  const s = String(raw ?? "")
    .replace(/\u201c|\u201d|\u2018|\u2019/g, '"')
    .trim();
  if (!s) return "";

  const fromAttr =
    s.match(/content\s*=\s*["']([^"']+)["']/i) ||
    s.match(/content\s*=\s*([^\s/>]+)/i);

  let token = (fromAttr ? fromAttr[1] : s).trim().replace(/^["']|["']$/g, "");

  // If user pasted a full tag and regex missed, strip tags then retry content=
  if ((!fromAttr || !token) && /<meta/i.test(s)) {
    const stripped = s.replace(/<[^>]+>/g, " ").trim();
    const again = stripped.match(/content\s*=\s*["']?([^\s"']+)/i);
    if (again) token = again[1].trim();
  }

  // Bare paste that still looks like markup — keep only token-like chars
  if (/[<>]/.test(token) || /meta/i.test(token)) {
    const only = token.match(
      /(?:content\s*=\s*["']?)?([A-Za-z0-9_+\/=.-]{8,})/
    );
    token = only ? only[1] : token.replace(TOKEN_CHARS, "");
  }

  return token.replace(TOKEN_CHARS, "").slice(0, 200);
}

export function applyGoogleSiteVerification(raw: unknown): void {
  if (typeof document === "undefined") return;
  const content = parseGoogleSiteVerificationInput(raw);
  const existing = document.querySelector(`meta[name="${META_NAME}"]`);

  if (!content) {
    existing?.remove();
    return;
  }

  let meta = existing as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", META_NAME);
    document.head.appendChild(meta);
  }
  if (meta.getAttribute("content") !== content) {
    meta.setAttribute("content", content);
  }
}

export function googleSiteVerificationMetaSnippet(content: string): string {
  const token = parseGoogleSiteVerificationInput(content);
  if (!token) return "";
  return `<meta name="google-site-verification" content="${token}" />`;
}
