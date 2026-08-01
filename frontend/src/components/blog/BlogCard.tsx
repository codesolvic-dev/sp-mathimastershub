import React from "react";
import { Link } from "react-router-dom";
import { useBlogCardStyle, type BlogCardStyleId } from "@/context/BlogCardStyleContext";
import { cn } from "@/lib/utils";

export type BlogCardProps = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  date?: string;
  niche?: string;
  views?: number;
  to?: string;
  /** Preview picker override */
  forceStyle?: BlogCardStyleId;
  className?: string;
  inView?: boolean;
  index?: number;
};

const FALLBACK_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect fill="#e5e7eb" width="800" height="450"/><path fill="#9ca3af" d="M320 280l60-80 50 60 40-50 70 90H320z"/><circle fill="#9ca3af" cx="290" cy="180" r="28"/></svg>`
  );

function resolveImage(src?: string) {
  const raw = String(src || "").trim();
  if (!raw || raw === "/product.png" || raw === "/hero.png") return FALLBACK_IMG;
  if (raw.startsWith("http") || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/")) return raw;
  return `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function plainExcerpt(html?: string, max = 140) {
  if (!html) return "";
  const text = String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function BlogImage({
  src,
  alt,
  aspectClass,
}: {
  src: string;
  alt: string;
  aspectClass: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden bg-gray-200",
        aspectClass
      )}
      style={aspectClass.includes("9/6") ? { aspectRatio: "9 / 6" } : { aspectRatio: "16 / 9" }}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 block w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          if (el.src !== FALLBACK_IMG) el.src = FALLBACK_IMG;
        }}
      />
    </div>
  );
}

export default function BlogCard({
  id,
  title,
  description,
  image,
  date,
  niche,
  views,
  to,
  forceStyle,
  className,
  inView = true,
  index = 0,
}: BlogCardProps) {
  const { blogCardStyle } = useBlogCardStyle();
  const style = forceStyle || blogCardStyle;
  const href = to || `/blog/${id}`;
  const img = resolveImage(image);
  const excerpt = plainExcerpt(description);

  const wrapClass = cn(
    "transition-all duration-600 ease-out",
    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    className
  );
  const wrapStyle = inView ? { transitionDelay: `${100 + index * 80}ms` } : undefined;

  // Style 2 — 9:6 image, title, excerpt, Read more (no card chrome)
  if (style === "2") {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <Link to={href} className="group block w-full text-left">
          <BlogImage src={img} alt={title} aspectClass="aspect-[9/6]" />
          <div className="pt-4">
            <h3 className="font-semibold text-gray-900 text-[18px] leading-snug mb-2 line-clamp-2">
              {title}
            </h3>
            {excerpt ? (
              <p className="text-[16px] text-gray-700 leading-relaxed mb-3 line-clamp-3">{excerpt}</p>
            ) : null}
            <span className="text-[16px] text-gray-900 underline underline-offset-2 decoration-gray-900 group-hover:text-[var(--theme-primary)] group-hover:decoration-[var(--theme-primary)] transition-colors">
              Read more
            </span>
          </div>
        </Link>
      </div>
    );
  }

  // Style 1 — 16:9 image card, title, category badge + views + date
  return (
    <div className={wrapClass} style={wrapStyle}>
      <Link to={href} className="group block w-full cursor-pointer">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
          <BlogImage src={img} alt={title} aspectClass="aspect-[16/9]" />
          <div className="p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-[var(--theme-primary)] transition-colors">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {niche ? (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {niche}
                </span>
              ) : null}
              {(views ?? 0) > 0 ? (
                <span className="text-xs text-gray-500">
                  {views} view{(views ?? 0) !== 1 ? "s" : ""}
                </span>
              ) : null}
              {date ? <span className="text-xs text-gray-500">{date}</span> : null}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
