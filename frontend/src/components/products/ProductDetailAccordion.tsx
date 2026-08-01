import React, { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { youtubeEmbedSrc } from "@/utils/youtubeEmbed";
import ExpandableClampText from "@/components/products/ExpandableClampText";

type ProductDetailAccordionProps = {
  description?: string;
  specificationsHtml?: string;
  videoUrl?: string;
  videoUrl2?: string;
  qaHtml?: string;
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
  if (/\/embed\//i.test(raw) || /player\.vimeo\.com/i.test(raw) || /^https?:\/\//i.test(raw)) {
    return { type: "iframe", src: raw };
  }
  return null;
}

function VideoBlock({ url, title }: { url?: string; title: string }) {
  const playable = resolvePlayableVideo(url);
  if (!playable) {
    return <p className="text-sm text-gray-500">No demo video available.</p>;
  }
  if (playable.type === "video") {
    return (
      <video
        className="w-full h-[190px] sm:h-[240px] rounded-lg bg-black object-cover"
        src={playable.src}
        controls
        playsInline
        preload="metadata"
      />
    );
  }
  return (
    <iframe
      className="w-full h-[190px] sm:h-[240px] rounded-lg bg-black"
      src={playable.src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

type AccordionItem = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export default function ProductDetailAccordion({
  description,
  specificationsHtml,
  videoUrl,
  videoUrl2,
  qaHtml,
}: ProductDetailAccordionProps) {
  const items = useMemo<AccordionItem[]>(() => {
    const list: AccordionItem[] = [];

    list.push({
      id: "description",
      title: "Description",
      content: hasTextContent(description) ? (
        <ExpandableClampText
          text={description!}
          lines={2.5}
          className="text-sm text-gray-600"
          buttonClassName="text-gray-800"
        />
      ) : (
        <p className="text-sm text-gray-500">No description available.</p>
      ),
    });

    list.push({
      id: "specifications",
      title: "Specifications",
      content: hasTextContent(specificationsHtml) ? (
        <div
          className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: specificationsHtml! }}
        />
      ) : (
        <p className="text-sm text-gray-500">No specifications available.</p>
      ),
    });

    const hasVideo = Boolean(resolvePlayableVideo(videoUrl) || resolvePlayableVideo(videoUrl2));
    list.push({
      id: "demo-video",
      title: "Demo Video",
      content: hasVideo ? (
        <div className="space-y-4">
          {resolvePlayableVideo(videoUrl) ? <VideoBlock url={videoUrl} title="Demo video 1" /> : null}
          {resolvePlayableVideo(videoUrl2) ? <VideoBlock url={videoUrl2} title="Demo video 2" /> : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No demo video available.</p>
      ),
    });

    list.push({
      id: "qa",
      title: "Customer questions & answers",
      content: hasTextContent(qaHtml) ? (
        <div
          className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: qaHtml! }}
        />
      ) : (
        <p className="text-sm text-gray-500">No questions yet. Check back soon.</p>
      ),
    });

    return list;
  }, [description, specificationsHtml, videoUrl, videoUrl2, qaHtml]);

  const [openId, setOpenId] = useState<string>("description");

  return (
    <div className="w-full space-y-2">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className="rounded-md overflow-hidden bg-gray-100">
            <button
              type="button"
              onClick={() => setOpenId(open ? "" : item.id)}
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left"
              aria-expanded={open}
            >
              <span className="text-sm sm:text-base font-medium text-gray-800">{item.title}</span>
              {open ? (
                <Minus className="w-4 h-4 text-gray-600 shrink-0" />
              ) : (
                <Plus className="w-4 h-4 text-gray-600 shrink-0" />
              )}
            </button>
            {open ? (
              <div className="px-4 sm:px-5 pb-4 pt-0 text-sm text-gray-600">{item.content}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
