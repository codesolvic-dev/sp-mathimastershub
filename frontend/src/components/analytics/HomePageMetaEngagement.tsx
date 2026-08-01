import { useEffect } from "react";
import { metaPixel } from "@/utils/metaPixel";

const SCROLL_MARKS = [25, 50, 75, 100] as const;

function labelFor(el: Element): string {
  const html = el as HTMLElement;
  const text = (html.innerText || html.getAttribute("aria-label") || html.getAttribute("title") || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  if (text) return text;
  if (el instanceof HTMLAnchorElement && el.href) return el.href;
  return el.tagName.toLowerCase();
}

function isInteractiveTarget(el: Element | null): Element | null {
  if (!el || !(el instanceof Element)) return null;
  const hit = el.closest(
    "a, button, [role='button'], input[type='submit'], input[type='button'], .theme-button"
  );
  return hit;
}

/**
 * Home-page engagement listeners for Meta Pixel (button / scroll / mouse in-out).
 * Throttled so Events Manager is not flooded.
 */
export default function HomePageMetaEngagement() {
  useEffect(() => {
    const firedScroll = new Set<number>();
    const mouseInCooldown = new WeakMap<Element, number>();
    const mouseOutCooldown = new WeakMap<Element, number>();
    let lastButtonAt = 0;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const height = doc.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const percent = Math.min(100, Math.round((scrollTop / height) * 100));
      for (const mark of SCROLL_MARKS) {
        if (percent >= mark && !firedScroll.has(mark)) {
          firedScroll.add(mark);
          metaPixel.scroll(mark);
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = isInteractiveTarget(e.target as Element | null);
      if (!target) return;
      const now = Date.now();
      if (now - lastButtonAt < 400) return;
      lastButtonAt = now;
      const href =
        target instanceof HTMLAnchorElement
          ? target.getAttribute("href") || undefined
          : undefined;
      metaPixel.buttonClick({ label: labelFor(target), href });
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = isInteractiveTarget(e.target as Element | null);
      if (!target) return;
      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) return;
      const now = Date.now();
      const prev = mouseInCooldown.get(target) || 0;
      if (now - prev < 1500) return;
      mouseInCooldown.set(target, now);
      metaPixel.mouseIn({ label: labelFor(target) });
    };

    const onMouseOut = (e: MouseEvent) => {
      const target = isInteractiveTarget(e.target as Element | null);
      if (!target) return;
      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) return;
      const now = Date.now();
      const prev = mouseOutCooldown.get(target) || 0;
      if (now - prev < 1500) return;
      mouseOutCooldown.set(target, now);
      metaPixel.mouseOut({ label: labelFor(target) });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("mouseout", onMouseOut, true);
    };
  }, []);

  return null;
}
