/** Extract YouTube video id from common URL shapes. */
export function youtubeVideoIdFromUrl(url: string): string | null {
  const u = String(url || "").trim();
  if (!u) return null;
  const short = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const watch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return watch[1];
  const embed = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embed) return embed[1];
  const shorts = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return shorts[1];
  const live = u.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (live) return live[1];
  return null;
}

export function youtubeEmbedSrc(url: string): string | null {
  const id = youtubeVideoIdFromUrl(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumbnailUrl(
  url: string,
  quality: "maxresdefault" | "hqdefault" = "hqdefault"
): string | null {
  const id = youtubeVideoIdFromUrl(url);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
}
