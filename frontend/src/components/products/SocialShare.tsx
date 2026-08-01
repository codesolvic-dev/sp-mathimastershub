import React, { useState } from "react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { Share2, Twitter, Linkedin, Mail, Link2 } from "lucide-react";
import { FaPinterest } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { incrementProductShare } from "@/api/product.api";

interface SocialShareProps {
  productName: string;
  productUrl: string;
  companyName?: string;
  productImage?: string;
  productDescription?: string;
  productId?: string;
  onShared?: () => void;
}

function toAbsoluteUrl(url?: string): string {
  if (!url?.trim()) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (typeof window === "undefined") return trimmed;
  if (trimmed.startsWith("//")) return `${window.location.protocol}${trimmed}`;
  if (trimmed.startsWith("/")) return `${window.location.origin}${trimmed}`;
  return `${window.location.origin}/${trimmed}`;
}

function blobToFile(blob: Blob, productName: string): File {
  const ext = blob.type.split("/")[1]?.split("+")[0] || "jpg";
  const safeName = productName.replace(/[^\w\-]+/g, "_").slice(0, 40) || "product";
  return new File([blob], `${safeName}.${ext}`, { type: blob.type || "image/jpeg" });
}

/** Build a shareable image File (fetch → DOM canvas fallback). */
async function getProductShareFile(imageUrl: string, productName: string): Promise<File | null> {
  if (!imageUrl) return null;

  // 1) Direct fetch
  try {
    const res = await fetch(imageUrl, { mode: "cors", credentials: "omit" });
    if (res.ok) {
      const blob = await res.blob();
      if (blob.type.startsWith("image/") || blob.size > 0) {
        return blobToFile(
          blob.type.startsWith("image/") ? blob : new Blob([blob], { type: "image/jpeg" }),
          productName
        );
      }
    }
  } catch {
    /* try canvas next */
  }

  // 2) Already-rendered gallery <img> (avoids CORS when browser cached it)
  try {
    const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
    const match =
      imgs.find((img) => img.currentSrc === imageUrl || img.src === imageUrl) ||
      imgs.find((img) => imageUrl && (img.currentSrc?.includes(imageUrl) || img.src?.includes(imageUrl)));

    if (match && match.naturalWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = match.naturalWidth;
      canvas.height = match.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(match, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.92)
        );
        if (blob) return blobToFile(blob, productName);
      }
    }
  } catch {
    /* tainted canvas / not found */
  }

  // 3) Load into a fresh Image with crossOrigin
  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
    if (blob) return blobToFile(blob, productName);
  } catch {
    /* ignore */
  }

  return null;
}

export default function SocialShare({
  productName,
  productUrl,
  companyName = "",
  productImage,
  productDescription,
  productId,
  onShared,
}: SocialShareProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { success } = useToast();

  const trackShare = () => {
    if (!productId) return;
    onShared?.();
    incrementProductShare(productId);
  };

  const shareTitle = (productName || "Product").trim();
  const shareBrand = companyName.trim();
  const displayTitle = shareBrand ? `${shareTitle} | ${shareBrand}` : shareTitle;
  const shareImage = toAbsoluteUrl(productImage);
  const shareText =
    productDescription?.replace(/<[^>]*>/g, "").trim().slice(0, 160) || displayTitle;

  /** Always: product title + product page link (+ image URL as fallback for apps without file support). */
  const titleAndLink = `${displayTitle}\n${productUrl}`;
  const titleLinkAndImage = shareImage ? `${titleAndLink}\n${shareImage}` : titleAndLink;

  const encodedUrl = encodeURIComponent(productUrl);
  const encodedTitle = encodeURIComponent(displayTitle);
  const encodedTitleAndLink = encodeURIComponent(titleAndLink);
  const encodedImage = encodeURIComponent(shareImage);

  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  // WhatsApp: title + product link (preview image comes from OG / native file share)
  const whatsappShare = `https://wa.me/?text=${encodedTitleAndLink}`;
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const pinterestShare = shareImage
    ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`
    : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`;
  const emailShare = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(titleLinkAndImage)}`;

  const iconColor = "white";
  const iconSize = 20;
  const sharedClass =
    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-110";

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    trackShare();
    setPopupOpen(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(titleLinkAndImage).then(() => {
      success("Product title, link & image copied");
      trackShare();
      setPopupOpen(false);
    });
  };

  /**
   * Native share: Image file + title + product link.
   * When files are present, put title+link in `text` (many apps drop the `url` field with files).
   */
  const shareNative = async (): Promise<boolean> => {
    if (typeof navigator.share !== "function") return false;

    const file = shareImage ? await getProductShareFile(shareImage, shareTitle) : null;

    if (file) {
      const withImage: ShareData = {
        files: [file],
        title: displayTitle,
        text: titleAndLink,
      };
      const can =
        typeof navigator.canShare !== "function" || navigator.canShare(withImage);
      if (can) {
        try {
          await navigator.share(withImage);
          return true;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") throw err;
          // fall through to text+url share
        }
      }
    }

    await navigator.share({
      title: displayTitle,
      text: titleLinkAndImage,
      url: productUrl,
    });
    return true;
  };

  const runShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (typeof navigator.share === "function") {
        const shared = await shareNative();
        if (shared) trackShare();
      } else {
        setPopupOpen(true);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setPopupOpen(true);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const shared = await shareNative();
      if (shared) {
        trackShare();
        setPopupOpen(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share error:", err);
      }
    }
  };

  return (
    <div className="mt-4">
      <span className="text-sm text-gray-700 mb-3 block">Share with Others</span>
      <div className="flex items-center gap-3">
        <a
          href={facebookShare}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShare}
          className={sharedClass}
          style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-dark, #6B4A2C)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary, #8B5E3C)";
          }}
          title="Share on Facebook"
        >
          <FaFacebookF size={iconSize} color={iconColor} />
        </a>

        <a
          href={whatsappShare}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackShare}
          className={sharedClass}
          style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-dark, #6B4A2C)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary, #8B5E3C)";
          }}
          title="Share on WhatsApp"
        >
          <FaWhatsapp size={iconSize} color={iconColor} />
        </a>

        <button
          type="button"
          disabled={sharing}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void runShare();
          }}
          className={sharedClass}
          style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-dark, #6B4A2C)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary, #8B5E3C)";
          }}
          title="Share product (image, title & link)"
          aria-label="Share product image, title and link"
        >
          <Share2 size={iconSize} color={iconColor} />
        </button>
      </div>

      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent
          className="sm:max-w-md border-gray-600 text-white p-0 gap-0 overflow-hidden"
          style={{ backgroundColor: "#2d2d2d" }}
        >
          <DialogHeader className="p-4 pb-2 text-center border-b border-gray-600">
            <DialogTitle className="text-lg font-semibold text-white">Share product</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-600 bg-[#1f1f1f]">
            {shareImage ? (
              <img
                src={shareImage}
                alt={shareTitle}
                className="w-14 h-14 rounded object-cover shrink-0 bg-gray-700"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-gray-700 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{displayTitle}</p>
              <p className="text-xs text-gray-400 truncate" title={productUrl}>
                {productUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-600 bg-[#1f1f1f]">
            <Link2 className="shrink-0 w-5 h-5 text-gray-400" aria-hidden />
            <span className="flex-1 min-w-0 text-sm text-gray-300 truncate" title={productUrl}>
              {productUrl}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 p-2 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
              title="Copy title, link & image"
              aria-label="Copy title, link and image"
            >
              <Link2 className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-xs text-gray-400 mb-3">Share to</p>
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => openShare(facebookShare)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white transition-colors"
                title="Facebook"
              >
                <FaFacebookF size={24} />
                <span className="text-xs">Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => openShare(twitterShare)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-black hover:bg-gray-900 text-white transition-colors"
                title="Twitter"
              >
                <Twitter size={24} />
                <span className="text-xs">Twitter</span>
              </button>
              <button
                type="button"
                onClick={() => openShare(whatsappShare)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white transition-colors"
                title="WhatsApp"
              >
                <FaWhatsapp size={24} />
                <span className="text-xs">WhatsApp</span>
              </button>
              <a
                href={emailShare}
                onClick={() => {
                  trackShare();
                  setPopupOpen(false);
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#EA4335] hover:bg-[#D33426] text-white transition-colors"
                title="Gmail"
              >
                <Mail size={24} />
                <span className="text-xs">Gmail</span>
              </a>
              <button
                type="button"
                onClick={() => openShare(linkedinShare)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#0077B5] hover:bg-[#006399] text-white transition-colors"
                title="LinkedIn"
              >
                <Linkedin size={24} />
                <span className="text-xs">LinkedIn</span>
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                title="Copy"
              >
                <Link2 size={24} />
                <span className="text-xs">Copy</span>
              </button>
              <button
                type="button"
                onClick={() => openShare(pinterestShare)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[#BD081C] hover:bg-[#A00718] text-white transition-colors"
                title="Pinterest"
              >
                <FaPinterest size={24} />
                <span className="text-xs">Pinterest</span>
              </button>
              {typeof navigator.share === "function" && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                  title="Share with image"
                >
                  <Share2 size={24} />
                  <span className="text-xs">Share</span>
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
