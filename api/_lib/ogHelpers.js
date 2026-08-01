export const CRAWLER_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|Applebot|Googlebot|bingbot|YandexBot|DuckDuckBot|Baiduspider|Sogou|Exabot|ia_archiver|Discordbot/i;

export function isCrawlerUserAgent(userAgent = "") {
  return CRAWLER_UA.test(userAgent || "");
}

export function getApiUrl() {
  const apiUrls = (process.env.VITE_API_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === "production";
  return isProduction
    ? apiUrls[1] || apiUrls[0] || process.env.VITE_API_URL || ""
    : apiUrls[0] || process.env.VITE_API_URL || "";
}

export function getFrontendOrigin(req) {
  const host = req?.headers?.host;
  if (host) {
    const protocol = host.includes("localhost") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  const fromEnv = process.env.VITE_FRONTEND_URL || process.env.VERCEL_URL;
  if (!fromEnv) return "";
  return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
}

export function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export function cleanDescription(raw, fallback = "") {
  let description = raw || fallback;
  if (!description) return fallback;

  description = String(description)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .replace(/\s+/g, " ");

  if (description.length > 200) {
    description = `${description.substring(0, 197)}...`;
  }

  return description || fallback;
}

export function toAbsoluteUrl(url, apiUrl, frontendOrigin) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  const apiBase = (apiUrl || "").replace(/\/api\/?$/, "");
  if (trimmed.startsWith("/")) {
    return `${apiBase || frontendOrigin || ""}${trimmed}`;
  }
  return `${apiBase || frontendOrigin || ""}/${trimmed}`;
}

export async function fetchCompany(apiUrl) {
  const fallback = { company: "Store", logo: "", favicon: "", description: "" };
  try {
    const companyRes = await fetch(`${apiUrl}/company`);
    if (!companyRes.ok) return fallback;
    const companyJson = await companyRes.json();
    const company = companyJson?.data || companyJson || fallback;
    return {
      company: company.company || fallback.company,
      logo: company.logo || "",
      favicon: company.favicon || "",
      description: company.description || "",
    };
  } catch {
    return fallback;
  }
}

export function ogCacheHeaders({ short = false } = {}) {
  return {
    "Content-Type": "text/html; charset=utf-8",
    // Shorter cache so share preview image updates after product/brand changes
    "Cache-Control": short
      ? "public, s-maxage=300, stale-while-revalidate=3600"
      : "public, s-maxage=3600, stale-while-revalidate=86400",
  };
}

function isWeakPlaceholderImage(url) {
  const u = String(url || "").trim().toLowerCase();
  if (!u) return true;
  return (
    u === "/product.png" ||
    u.endsWith("/product.png") ||
    u.includes("logo-removebg-preview") ||
    u === "data:," ||
    u === "/default-category.png"
  );
}

/**
 * Pick OG/share image.
 * For product/blog pages: content image first, then company brand.
 * Set preferBrand: true only for homepage / site-wide shares.
 */
export function pickShareImage({
  companyLogo,
  companyFavicon,
  productImage,
  apiUrl,
  frontendOrigin,
  preferBrand = false,
}) {
  const contentAbs = toAbsoluteUrl(productImage, apiUrl, frontendOrigin);
  const brandAbs = toAbsoluteUrl(companyLogo || companyFavicon, apiUrl, frontendOrigin);
  const contentOk = contentAbs && !isWeakPlaceholderImage(productImage);

  if (preferBrand) {
    return brandAbs || (contentOk ? contentAbs : "") || contentAbs || "";
  }

  // Product / blog share: never prefer company logo over a real product image
  if (contentOk) return contentAbs;
  if (brandAbs) return brandAbs;
  return contentAbs || "";
}
