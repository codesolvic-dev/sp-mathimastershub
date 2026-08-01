/**
 * Build a Google Maps iframe embed URL.
 * Company Address drives the pin; googleMapUrl is only an optional embed override.
 */
export function toGoogleMapEmbedUrl(mapUrl: string, fallbackAddress = ""): string {
  const raw = String(mapUrl || "").trim();
  const address = String(fallbackAddress || "").trim();

  // Optional override: full iframe HTML or maps/embed URL
  if (raw) {
    const iframeSrc = raw.match(/src=["']([^"']+)["']/i);
    if (iframeSrc?.[1]) return iframeSrc[1].trim();

    if (/google\.[^/]+\/maps\/embed/i.test(raw) || raw.includes("maps/embed?")) {
      return raw;
    }
  }

  // Primary: company Address field → show that place on the map
  if (address) return addressEmbed(address);

  // Fallback: plain place text in googleMapUrl
  if (raw && !/^https?:\/\//i.test(raw)) return addressEmbed(raw);

  // Fallback: Maps share / place link
  if (
    raw &&
    (/google\.[^/]+\/maps/i.test(raw) ||
      raw.includes("goo.gl/maps") ||
      raw.includes("maps.app.goo.gl"))
  ) {
    return addressEmbed(raw);
  }

  return "";
}

function addressEmbed(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
}

/** Openable Maps link for the address card. */
export function toGoogleMapOpenUrl(mapUrl: string, fallbackAddress = ""): string {
  const raw = String(mapUrl || "").trim();
  const address = String(fallbackAddress || "").trim();
  const query = address || raw;

  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  if (raw && /^https?:\/\//i.test(raw) && !/<iframe/i.test(raw) && !raw.includes("maps/embed")) {
    return raw;
  }

  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return "https://www.google.com/maps";
}

/** Directions link for a place / address. */
export function toGoogleMapDirectionsUrl(address: string): string {
  const q = String(address || "").trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** Split address into short title + full line (Google place-card style). */
export function splitMapAddressLabel(address: string): { title: string; detail: string } {
  const full = String(address || "").trim();
  if (!full) return { title: "", detail: "" };
  const comma = full.indexOf(",");
  if (comma > 0) {
    return { title: full.slice(0, comma).trim(), detail: full };
  }
  return { title: full, detail: full };
}
