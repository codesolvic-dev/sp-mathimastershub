import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import PageLoader from "@/components/ui/PageLoader";
import {
  deleteMedia,
  formatMediaSize,
  getMedia,
  getMediaStats,
  syncWebsiteMedia,
  type MediaItem,
  uploadMediaFiles,
} from "@/api/media.api";
import { resolvePublicAssetUrl } from "@/utils/mediaUrl";
import {
  Check,
  ImageIcon,
  Link2,
  Search,
  Upload,
} from "lucide-react";

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
};

export type MediaPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  maxSelection?: number;
  title?: string;
};

async function copyMediaUrl(url: string): Promise<boolean> {
  const value = String(url || "").trim();
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function MediaGridItem({
  item,
  selected,
  onToggle,
  onCopyUrl,
}: {
  item: MediaItem;
  selected: boolean;
  onToggle: () => void;
  onCopyUrl: (url: string) => void;
}) {
  const url = resolvePublicAssetUrl(item.url);
  const label = item.originalName || item.filename || "Image";

  return (
    <div
      className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-white ${
        selected
          ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      <button type="button" onClick={onToggle} className="absolute inset-0 text-left" aria-label={`Select ${label}`}>
        <img src={url} alt={item.alt || label} className="w-full h-full object-cover" loading="lazy" />
      </button>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pointer-events-none">
        <p className="text-[10px] text-white truncate">{label}</p>
        <p className="text-[9px] text-white/75">{formatMediaSize(item.size)}</p>
      </div>
      <button
        type="button"
        title="Copy image URL"
        aria-label="Copy image URL"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopyUrl(url);
        }}
        className="absolute top-2 left-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity w-7 h-7 rounded-md bg-black/65 text-white hover:bg-black/80 flex items-center justify-center shadow"
      >
        <Link2 className="w-3.5 h-3.5" />
      </button>
      {selected && (
        <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center z-10">
          <Check className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}

export function MediaPickerModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  maxSelection = multiple ? 10 : 1,
  title = "Select image from media library",
}: MediaPickerModalProps) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMedia({ page, limit: 24, q: debouncedSearch || undefined });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      error("Failed to load media library.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, error]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        await syncWebsiteMedia();
      } catch {
        // ignore — library still loads uploaded items
      }
      if (!cancelled) loadMedia();
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadMedia]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
      setSelectedIds(new Set());
      setUploadJobs([]);
    }
  }, [open]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(String(item._id || item.id))),
    [items, selectedIds]
  );

  const toggleSelect = (item: MediaItem) => {
    const id = String(item._id || item.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (!multiple) {
        return new Set([id]);
      }
      if (next.size >= maxSelection) return next;
      next.add(id);
      return next;
    });
  };

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      error("Please choose image files only.");
      return;
    }

    const jobId = `upload-${Date.now()}`;
    setUploading(true);
    setUploadJobs([{ id: jobId, name: list.length === 1 ? list[0].name : `${list.length} images`, progress: 0, status: "uploading" }]);

    try {
      const uploaded = await uploadMediaFiles(list, (progress, name) => {
        setUploadJobs([{ id: jobId, name, progress, status: "uploading" }]);
      });
      setUploadJobs([{ id: jobId, name: `${uploaded.length} uploaded`, progress: 100, status: "done" }]);
      success(`${uploaded.length} image(s) uploaded.`);
      setPage(1);
      await loadMedia();
      if (uploaded.length === 1 && !multiple) {
        setSelectedIds(new Set([String(uploaded[0]._id || uploaded[0].id)]));
      }
    } catch {
      setUploadJobs([{ id: jobId, name: "Upload failed", progress: 0, status: "error" }]);
      error("Upload failed.");
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadJobs([]), 2000);
    }
  };

  const handleConfirm = () => {
    if (!selectedItems.length) {
      error("Select at least one image.");
      return;
    }
    onSelect(selectedItems);
    onOpenChange(false);
  };

  const handleCopyUrl = async (url: string) => {
    const ok = await copyMediaUrl(url);
    if (ok) success("Media URL copied");
    else error("Could not copy URL");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0 gap-0 bg-white text-gray-900 border-gray-200 shadow-xl [&>button]:text-gray-500 [&>button]:hover:text-gray-900 [&>button]:hover:bg-gray-100">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white">
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-gray-500">
            Upload from PC or pick from your media library ({total} images). Hover an image to copy its URL.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto bg-white">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search images…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" />
              Upload from PC
            </Button>
          </div>

          {uploadJobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="truncate pr-2">{job.name}</span>
                <span className={job.status === "error" ? "text-red-600" : "text-gray-600"}>
                  {job.status === "uploading" ? `${job.progress}%` : job.status === "done" ? "Done" : "Failed"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    job.status === "error" ? "bg-red-500" : "bg-[var(--theme-primary)]"
                  }`}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          ))}

          {loading ? (
            <div className="py-16">
              <PageLoader />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No images yet. Upload from your PC to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {items.map((item) => (
                <MediaGridItem
                  key={String(item._id || item.id)}
                  item={item}
                  selected={selectedIds.has(String(item._id || item.id))}
                  onToggle={() => toggleSelect(item)}
                  onCopyUrl={handleCopyUrl}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="bg-white border-gray-300 text-gray-800">
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="bg-white border-gray-300 text-gray-800">
                Next
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button type="button" className="theme-button text-white" onClick={handleConfirm}>
            Use selected ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MediaPickerModal;
