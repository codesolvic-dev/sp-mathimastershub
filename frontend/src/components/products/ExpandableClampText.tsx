import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ExpandableClampTextProps = {
  text: string;
  /** Collapsed visible lines (supports fractions e.g. 2.5) */
  lines?: number;
  className?: string;
  buttonClassName?: string;
};

function toPlain(htmlOrText: string) {
  return String(htmlOrText || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text block with line clamp + Show more / Show less. */
export default function ExpandableClampText({
  text,
  lines = 6,
  className = "",
  buttonClassName = "",
}: ExpandableClampTextProps) {
  const plain = toPlain(text);
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const measureRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [plain]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || !plain) {
      setNeedsExpand(false);
      return;
    }
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const lh = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 24;
    const collapsedMax = lh * lines;
    // Temporarily clear clamp to measure natural height
    const prev = {
      display: el.style.display,
      webkitBoxOrient: el.style.webkitBoxOrient,
      webkitLineClamp: el.style.webkitLineClamp,
      maxHeight: el.style.maxHeight,
      overflow: el.style.overflow,
    };
    el.style.display = "block";
    el.style.webkitBoxOrient = "";
    el.style.webkitLineClamp = "unset";
    el.style.maxHeight = "none";
    el.style.overflow = "visible";
    const full = el.scrollHeight;
    el.style.display = prev.display;
    el.style.webkitBoxOrient = prev.webkitBoxOrient;
    el.style.webkitLineClamp = prev.webkitLineClamp;
    el.style.maxHeight = prev.maxHeight;
    el.style.overflow = prev.overflow;
    setNeedsExpand(full > collapsedMax + 4);
  }, [plain, lines]);

  if (!plain) return null;

  const collapsedStyle: React.CSSProperties | undefined = expanded
    ? undefined
    : {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: Math.max(1, Math.ceil(lines)),
        maxHeight: `${lines * 1.625}em`,
        overflow: "hidden",
      };

  return (
    <div>
      <p ref={measureRef} className={cn("leading-relaxed", className)} style={collapsedStyle}>
        {plain}
      </p>
      {needsExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-2 text-sm font-semibold text-gray-800 underline underline-offset-2 hover:opacity-80",
            buttonClassName
          )}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
