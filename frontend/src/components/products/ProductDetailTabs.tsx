import React, { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cnTabsTriggerPill } from "@/components/ui/tabTriggerVariants";
import { cn } from "@/lib/utils";
import { youtubeEmbedSrc } from "@/utils/youtubeEmbed";

const tabTriggerClass = cnTabsTriggerPill("rounded-md min-h-9 px-4 sm:px-5 flex-1 sm:flex-none");
const tabContentClass =
  "mt-2 rounded-xl border border-[#E5E5E5] bg-[#FDFBF8] px-5 sm:px-6 py-5 sm:py-6 focus-visible:ring-0";

type ProductDetailTabsProps = {
  description?: string;
  returnsHtml?: string;
  careHtml?: string;
  videoUrl?: string;
  videoUrl2?: string;
};

function hasTextContent(value?: string) {
  return Boolean(value && value.trim() !== "" && value.replace(/<[^>]*>/g, "").trim() !== "");
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());
}

function resolvePlayableVideo(url?: string): { type: "iframe" | "video"; src: string } | null {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const youtube = youtubeEmbedSrc(raw);
  if (youtube) return { type: "iframe", src: youtube };

  if (isDirectVideoUrl(raw)) return { type: "video", src: raw };

  // Already an embed-style URL (vimeo, etc.)
  if (/\/embed\//i.test(raw) || /player\.vimeo\.com/i.test(raw)) {
    return { type: "iframe", src: raw };
  }

  // Fallback: try using the URL as iframe src
  if (/^https?:\/\//i.test(raw)) {
    return { type: "iframe", src: raw };
  }

  return null;
}

function DemoVideoPlayer({ url, title }: { url?: string; title: string }) {
  const playable = resolvePlayableVideo(url);
  if (!playable) {
    return (
      <p className="text-sm text-gray-500">
        Video could not be loaded. Please use a valid YouTube link (watch / youtu.be / shorts) or a direct video file URL.
      </p>
    );
  }

  if (playable.type === "video") {
    return (
      <video
        className="w-full h-[190px] sm:h-[230px] lg:h-[280px] rounded-lg bg-black object-cover"
        src={playable.src}
        controls
        playsInline
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <iframe
      className="w-full h-[190px] sm:h-[230px] lg:h-[280px] rounded-lg bg-black"
      src={playable.src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

function cleanHtmlContent(html: string | undefined) {
  if (!html) return "";
  let cleaned = html
    .replace(/<img[^>]*src\s*=\s*["']?[^"'>]*["']?[^>]*>/gi, (match) => {
      if (match.includes("wqwwwq") || match.includes("placeholder") || !match.match(/src\s*=\s*["']([^"']+)["']/)) {
        return "";
      }
      return match;
    })
    .replace(/<img[^>]*>/gi, (match) => {
      if (!match.match(/src\s*=\s*["']([^"']+)["']/)) return "";
      return match;
    });

  cleaned = cleaned.replace(/style\s*=\s*["'][^"']*background[^"']*["']/gi, (match) => {
    const styleContent = match.match(/style\s*=\s*["']([^"']+)["']/)?.[1] || "";
    const cleanedStyle = styleContent
      .split(";")
      .filter((prop) => !prop.trim().toLowerCase().includes("background"))
      .join(";");
    return cleanedStyle ? `style="${cleanedStyle}"` : "";
  });

  cleaned = cleaned.replace(/background-color\s*:\s*[^;]+;?/gi, "");
  cleaned = cleaned.replace(/background\s*:\s*[^;]+;?/gi, "");
  return cleaned;
}

function isHtmlContent(value?: string) {
  return Boolean(value && /<[a-z][\s\S]*>/i.test(value));
}

function ExpandableContent({
  plainText,
  html,
  className = "",
}: {
  plainText?: string;
  html?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const cleanedHtml = html ? cleanHtmlContent(html) : "";
  const plain = plainText || cleanedHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const needsExpand = plain.length > 200;

  if (!plain) return null;

  const contentClass = cn(
    "text-sm text-gray-900 leading-7",
    !expanded && needsExpand && "line-clamp-4",
    expanded && "[&_p]:mb-3 [&_p:last-child]:mb-0"
  );

  return (
    <div className={className}>
      {html ? (
        <div
          className={cn("product-detail-tab-content", contentClass, !expanded && needsExpand && "[&_p]:mb-0")}
          dangerouslySetInnerHTML={{ __html: cleanedHtml }}
        />
      ) : (
        <p className={cn(contentClass, "whitespace-pre-line")}>{plainText}</p>
      )}
      {needsExpand && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 text-sm font-bold text-gray-900 underline underline-offset-2 hover:opacity-80"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function ProductDetailTabs({
  description,
  returnsHtml,
  careHtml,
  videoUrl,
  videoUrl2,
}: ProductDetailTabsProps) {
  const hasDescription = hasTextContent(description);
  const hasReturns = hasTextContent(returnsHtml);
  const hasCare = hasTextContent(careHtml);
  const playableVideos = useMemo(
    () => [videoUrl, videoUrl2].map((url) => resolvePlayableVideo(url)).filter(Boolean),
    [videoUrl, videoUrl2]
  );
  const hasVideo = playableVideos.length > 0;

  const defaultTab = useMemo(() => {
    if (hasDescription) return "description";
    if (hasReturns) return "returns";
    if (hasCare) return "care";
    if (hasVideo) return "videos";
    return "description";
  }, [hasDescription, hasReturns, hasCare, hasVideo]);

  const emptyMessage = (
    <p className="text-sm text-gray-400 leading-7">No content added yet.</p>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue={defaultTab}>
        <TabsList
          className="flex h-auto w-full flex-wrap justify-start gap-1 bg-[#F5F5F5] p-1 rounded-lg"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <TabsTrigger value="description" className={tabTriggerClass}>
            Description
          </TabsTrigger>
          <TabsTrigger value="returns" className={tabTriggerClass}>
            Returns &amp; Exchange
          </TabsTrigger>
          <TabsTrigger value="care" className={tabTriggerClass}>
            Care Instructions
          </TabsTrigger>
          {hasVideo && (
            <TabsTrigger value="videos" className={tabTriggerClass}>
              Demo Video
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="description" className={tabContentClass}>
          {hasDescription ? (
            isHtmlContent(description) ? (
              <ExpandableContent html={description} />
            ) : (
              <ExpandableContent plainText={description} />
            )
          ) : (
            emptyMessage
          )}
        </TabsContent>

        <TabsContent value="returns" className={tabContentClass}>
          {hasReturns ? <ExpandableContent html={returnsHtml} /> : emptyMessage}
        </TabsContent>

        <TabsContent value="care" className={tabContentClass}>
          {hasCare ? <ExpandableContent html={careHtml} /> : emptyMessage}
        </TabsContent>

        {hasVideo && (
          <TabsContent value="videos" className={tabContentClass}>
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                playableVideos.length > 1 && "md:grid-cols-2"
              )}
            >
              {videoUrl?.trim() && (
                <DemoVideoPlayer url={videoUrl} title="Product demo video 1" />
              )}
              {videoUrl2?.trim() && (
                <DemoVideoPlayer url={videoUrl2} title="Product demo video 2" />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
