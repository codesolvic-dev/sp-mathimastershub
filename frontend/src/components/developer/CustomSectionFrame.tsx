import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navigateApp } from "@/utils/navigateApp";

const MIN_HEIGHT = 120;

const FULL_BLEED_STYLE = `
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
  scrollbar-width: none !important;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
/* Do not force background — custom sections set their own (e.g. mint testimonials) */
img, video { max-width: 100%; height: auto; display: block; }
/* Only force edge-to-edge on explicit banner wrappers (not content .container sections) */
.banner-wrapper {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.banner-wrapper img {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  display: block;
}
`.trim();

function injectFullBleedStyles(docHtml: string): string {
  const tag = `<style data-sp-full-bleed="1">${FULL_BLEED_STYLE}</style>`;
  if (/<\/head>/i.test(docHtml)) {
    return docHtml.replace(/<\/head>/i, `${tag}</head>`);
  }
  if (/<body[^>]*>/i.test(docHtml)) {
    return docHtml.replace(/<body[^>]*>/i, (m) => `${m}${tag}`);
  }
  return `${tag}${docHtml}`;
}

export function wrapCustomSectionHtml(html: string): string {
  const trimmed = (html || "").trim();
  if (!trimmed) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>`;
  }

  // Full HTML documents: still inject full-bleed overrides (custom banners often set max-width)
  if (/<html[\s>]/i.test(trimmed)) {
    return injectFullBleedStyles(trimmed);
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style data-sp-full-bleed="1">${FULL_BLEED_STYLE}</style>
  </head>
  <body>${trimmed}</body>
</html>`;
}

/** Keep app routes in the parent window — never navigate the iframe to /shop etc. */
function bindParentNavigation(doc: Document) {
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) return;
    if (anchor.hasAttribute("download")) return;

    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (url.origin !== window.location.origin) {
      window.open(url.href, "_blank", "noopener,noreferrer");
      return;
    }

    navigateApp(`${url.pathname}${url.search}${url.hash}` || "/");
  };

  doc.addEventListener("click", onClick, true);
  return () => doc.removeEventListener("click", onClick, true);
}

interface CustomSectionFrameProps {
  html: string;
  title?: string;
  className?: string;
  /** Bump to reload iframe (re-run scripts / animations) */
  reloadKey?: number;
}

export default function CustomSectionFrame({
  html,
  title = "Custom section",
  className = "",
  reloadKey = 0,
}: CustomSectionFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);

  const srcDoc = useMemo(() => wrapCustomSectionHtml(html), [html, reloadKey]);

  const resizeFrame = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const body = doc.body;
      const root = doc.documentElement;
      // +4 avoids subpixel overflow that shows an inner vertical scrollbar
      const next = Math.ceil(
        Math.max(
          body?.scrollHeight ?? 0,
          body?.offsetHeight ?? 0,
          root?.scrollHeight ?? 0,
          root?.offsetHeight ?? 0,
          MIN_HEIGHT
        ) + 4
      );
      setHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    } catch {
      /* cross-origin should not happen with srcDoc */
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      resizeFrame();
      window.setTimeout(resizeFrame, 100);
      window.setTimeout(resizeFrame, 500);
      window.setTimeout(resizeFrame, 1500);
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [srcDoc, resizeFrame]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: ResizeObserver | null = null;
    let unbindNav: (() => void) | null = null;

    const attach = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) return;
        unbindNav?.();
        unbindNav = bindParentNavigation(doc);
        observer?.disconnect();
        observer = new ResizeObserver(() => resizeFrame());
        observer.observe(doc.body);
        if (doc.documentElement) observer.observe(doc.documentElement);
      } catch {
        /* ignore */
      }
    };

    iframe.addEventListener("load", attach);
    attach();

    return () => {
      iframe.removeEventListener("load", attach);
      unbindNav?.();
      observer?.disconnect();
    };
  }, [srcDoc, resizeFrame]);

  return (
    <iframe
      ref={iframeRef}
      key={`${reloadKey}-${html.length}`}
      title={title}
      srcDoc={srcDoc}
      className={`w-full border-0 block overflow-hidden ${className}`}
      style={{ height, minHeight: MIN_HEIGHT, overflow: "hidden" }}
      scrolling="no"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
