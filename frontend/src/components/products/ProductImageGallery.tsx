import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  images: string[];
  /** Show thumbnail images. Default true. */
  showThumbnails?: boolean;
  /** Use transparent tile backgrounds instead of gray fills. */
  transparentBackground?: boolean;
  /** `ecom` = left thumbnails + main. `ecom-bottom` = main + bottom thumbnails (Style 2). */
  variant?: "default" | "ecom" | "ecom-bottom";
};

const ECOM_TILE_BG = "bg-[#f3efe8]";
const ACTIVE_THUMB_BORDER_CLASS = "border-[var(--theme-primary)]";

export default function ProductImageGallery({
  images,
  showThumbnails = true,
  transparentBackground = false,
  variant = "default",
}: Props) {
  const isProbablyRealImageUrl = (img: string) => {
    const t = img.trim();
    if (!t || t === "/product.png") return false;
    if (t.includes("wqwwwq")) return false;
    if (t.startsWith("blob:") || t.startsWith("data:")) return false;
    if (/^https?:\/\//i.test(t) || t.startsWith("//") || t.startsWith("/")) return true;
    return !t.toLowerCase().includes("placeholder");
  };

  const validImages = images.filter((img) => typeof img === "string" && isProbablyRealImageUrl(img));
  const displayImages = validImages.length > 0 ? validImages : ["/product.png"];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const selected = displayImages[selectedIndex] || "/product.png";
  const previewImage = displayImages[previewIndex] || selected;
  const total = displayImages.length;
  const counterLabel = `${previewIndex + 1}/${total}`;

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const next = ((index % total) + total) % total;
      setSelectedIndex(next);
      setPreviewIndex(next);
    },
    [total]
  );

  const goPrev = useCallback(() => goTo(selectedIndex - 1), [goTo, selectedIndex]);
  const goNext = useCallback(() => goTo(selectedIndex + 1), [goTo, selectedIndex]);
  const goPrevPreview = useCallback(() => goTo(previewIndex - 1), [goTo, previewIndex]);
  const goNextPreview = useCallback(() => goTo(previewIndex + 1), [goTo, previewIndex]);

  useEffect(() => {
    setSelectedIndex(0);
    setPreviewIndex(0);
  }, [displayImages.length, displayImages[0]]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrevPreview();
      if (e.key === "ArrowRight") goNextPreview();
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen, goPrevPreview, goNextPreview, closePreview]);

  useEffect(() => {
    if (!previewOpen || (variant !== "ecom" && variant !== "ecom-bottom")) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewOpen, variant]);

  const tileBg = transparentBackground ? "bg-transparent" : "bg-gray-100";

  const navBtnClass =
    "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md border border-gray-100 text-[#1a3d6b] hover:bg-gray-50 transition-colors disabled:opacity-40";

  if (variant === "ecom-bottom") {
    return (
      <div className="w-full max-w-xl">
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
          <button
            type="button"
            onClick={() => openPreview(selectedIndex)}
            className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label="Open image preview"
          >
            <img
              src={selected}
              alt="Product"
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/product.png";
              }}
            />
          </button>
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {showThumbnails && total > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {displayImages.map((img, i) => (
              <button
                key={`thumb-bottom-${i}`}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 overflow-hidden border-2 bg-gray-100 transition-all ${
                  selectedIndex === i
                    ? ACTIVE_THUMB_BORDER_CLASS
                    : "border-transparent opacity-90 hover:opacity-100"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/product.png";
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {previewOpen && (
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/85"
            role="dialog"
            aria-modal="true"
            aria-label="Product image gallery"
          >
            <button
              type="button"
              onClick={closePreview}
              className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-20 ${navBtnClass} w-10 h-10`}
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
            {total > 1 && (
              <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-white/95 shadow-sm border border-gray-100 text-sm font-medium text-[#1a3d6b]">
                {counterLabel}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center relative px-14 sm:px-20 py-16 min-h-0">
              {total > 1 && (
                <button
                  type="button"
                  onClick={goPrevPreview}
                  className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 ${navBtnClass}`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="max-w-4xl w-full max-h-full flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Product preview"
                  className="max-w-full max-h-[min(70vh,36rem)] object-contain select-none"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/product.png";
                  }}
                />
              </div>
              {total > 1 && (
                <button
                  type="button"
                  onClick={goNextPreview}
                  className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 ${navBtnClass}`}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "ecom") {
    return (
      <div className="w-full max-w-xl">
        <div className="flex gap-3 sm:gap-4 items-stretch">
          {showThumbnails && total > 1 && (
            <div className="flex flex-col gap-2 sm:gap-2.5 shrink-0 max-h-full overflow-y-auto scrollbar-hide py-0.5 self-stretch">
              {displayImages.map((img, i) => (
                <button
                  key={`thumb-${i}`}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${ECOM_TILE_BG} ${
                    selectedIndex === i
                      ? ACTIVE_THUMB_BORDER_CLASS
                      : "border-transparent opacity-90 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/product.png";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 min-w-0">
            <div
              className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden ${ECOM_TILE_BG} border border-gray-200/60`}
            >
              <button
                type="button"
                onClick={() => openPreview(selectedIndex)}
                className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer focus:outline-none"
                aria-label="Open image preview"
              >
                <img
                  src={selected}
                  alt="Product"
                  className="w-full h-full object-contain pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/product.png";
                  }}
                />
              </button>

              {/* <button
                type="button"
                onClick={() => openPreview(selectedIndex)}
                className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 shadow-sm border border-gray-100 text-xs sm:text-sm font-medium text-[#1a3d6b] hover:bg-white transition-colors"
              >
                <Expand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                View
              </button> */}

              {total > 1 && (
                <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-white/95 shadow-sm border border-gray-100 text-xs sm:text-sm font-medium text-[#1a3d6b]">
                  {selectedIndex + 1}/{total}
                </span>
              )}

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {previewOpen && (
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-black/85"
            role="dialog"
            aria-modal="true"
            aria-label="Product image gallery"
          >
            <button
              type="button"
              onClick={closePreview}
              className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-20 ${navBtnClass} w-10 h-10`}
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>

            {total > 1 && (
              <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-white/95 shadow-sm border border-gray-100 text-sm font-medium text-[#1a3d6b]">
                {counterLabel}
              </div>
            )}

            <div className="flex-1 flex items-center justify-center relative px-14 sm:px-20 py-16 min-h-0">
              {total > 1 && (
                <button
                  type="button"
                  onClick={goPrevPreview}
                  className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 ${navBtnClass}`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="max-w-4xl w-full max-h-full flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Product preview"
                  className="max-w-full max-h-[min(70vh,36rem)] object-contain select-none rounded-2xl"
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/product.png";
                  }}
                />
              </div>

              {total > 1 && (
                <button
                  type="button"
                  onClick={goNextPreview}
                  className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 ${navBtnClass}`}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {total > 1 && (
              <div className="shrink-0 pb-6 sm:pb-8 px-4 flex justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
                {displayImages.map((img, i) => (
                  <button
                    key={`modal-thumb-${i}`}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all bg-white/10 ${
                      previewIndex === i
                        ? ACTIVE_THUMB_BORDER_CLASS
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/product.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <button
        type="button"
        onClick={() => openPreview(selectedIndex)}
        className={`group relative w-full max-w-[26rem] aspect-square overflow-hidden rounded-lg border border-gray-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 ${tileBg} cursor-pointer`}
        aria-label="Open image preview"
      >
        <img
          src={selected}
          alt="Product"
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/product.png";
          }}
        />
        <span className="absolute bottom-3 right-3 flex items-center justify-center w-9 h-9 rounded-full bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn size={18} />
        </span>
      </button>

      {showThumbnails && (
      <div className="grid grid-cols-4 gap-2 w-full max-w-[26rem]">
        {displayImages.slice(0, 4).map((img, i) => (
          <div
            key={i}
              onClick={() => setSelectedIndex(i)}
              onDoubleClick={() => openPreview(i)}
              className={`group/thumb w-full aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${tileBg}
                ${selectedIndex === i ? ACTIVE_THUMB_BORDER_CLASS : "border-gray-200"}`}
          >
            <img
              src={img}
              alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/thumb:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/product.png";
              }}
            />
          </div>
        ))}
      </div>
      )}

      <Dialog open={previewOpen} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-[min(96vw,40rem)] w-full p-4 sm:p-6 gap-4 bg-white border border-gray-200 text-gray-900 shadow-xl">
          <DialogTitle className="sr-only">Product image preview</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[45vh] sm:min-h-[50vh] max-h-[62vh] overflow-hidden bg-white">
            <img
              src={previewImage}
              alt="Product preview"
              className="max-w-full max-h-[58vh] object-contain select-none"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/product.png";
              }}
            />
          </div>
          {displayImages.length > 1 && (
            <div className="flex justify-center gap-3 flex-wrap pt-1">
              {displayImages.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setPreviewIndex(i)}
                  className={`w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                    previewIndex === i
                      ? ACTIVE_THUMB_BORDER_CLASS
                      : "border-gray-200 opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/product.png";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
