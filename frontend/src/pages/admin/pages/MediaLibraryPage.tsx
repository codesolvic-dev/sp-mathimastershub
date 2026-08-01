import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import PageLoader from "@/components/ui/PageLoader";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import {
  deleteMedia,
  formatMediaSize,
  getMedia,
  getMediaStats,
  syncWebsiteMedia,
  type MediaItem,
  type MediaStats,
  uploadMediaFiles,
} from "@/api/media.api";
import { resolvePublicAssetUrl } from "@/utils/mediaUrl";
import {
  HardDrive,
  ImageIcon,
  Link2,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

type UploadJob = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
};

export default function MediaLibraryPage() {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MediaStats>({ total: 0, totalSize: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const didInitialSync = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const runSync = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setSyncing(true);
    try {
      const result = await syncWebsiteMedia();
      if (result.imported > 0 && !options?.silent) {
        success(`${result.imported} existing site image(s) added to library.`);
      }
      return result;
    } catch {
      if (!options?.silent) error("Failed to sync existing website images.");
      return null;
    } finally {
      if (!options?.silent) setSyncing(false);
    }
  }, [success, error]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, listData] = await Promise.all([
        getMediaStats(),
        getMedia({ page, limit: 30, q: debouncedSearch || undefined }),
      ]);
      setStats(statsData);
      setItems(listData.items);
      setTotalPages(listData.totalPages);
    } catch {
      error("Failed to load media library.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, error]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!didInitialSync.current) {
        didInitialSync.current = true;
        await runSync({ silent: true });
      }
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, runSync, refresh]);

  const handleUpload = async (files: FileList | File[] | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      error("Please choose image files only.");
      return;
    }

    setUploading(true);
    const jobs: UploadJob[] = list.map((file, i) => ({
      id: `job-${Date.now()}-${i}`,
      name: file.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploadJobs(jobs);

    try {
      await uploadMediaFiles(list, (progress) => {
        setUploadJobs((prev) =>
          prev.map((job) => ({ ...job, progress, status: "uploading" }))
        );
      });
      setUploadJobs((prev) =>
        prev.map((job) => ({ ...job, progress: 100, status: "done" }))
      );
      success(`${list.length} image(s) uploaded to media library.`);
      setPage(1);
      await refresh();
    } catch {
      setUploadJobs((prev) =>
        prev.map((job) => ({ ...job, status: "error" }))
      );
      error("Upload failed.");
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadJobs([]), 2500);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Delete ${selectedIds.size} image(s) from media library?`)) return;

    setDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteMedia(id)));
      success(`${selectedIds.size} image(s) deleted.`);
      setSelectedIds(new Set());
      await refresh();
    } catch {
      error("Failed to delete some images.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyMediaUrl = async (url: string) => {
    const value = String(url || "").trim();
    if (!value) {
      error("No URL available for this image.");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      success("Media URL copied");
    } catch {
      error("Could not copy URL");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold theme-heading flex items-center gap-2">
            <ImageIcon className="w-7 h-7" style={{ color: "var(--theme-primary)" }} />
            Media Library
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            WordPress-style media panel — upload from PC, search, and reuse images
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={syncing}
            onClick={async () => {
              await runSync();
              await refresh();
            }}
          >
            {syncing ? "Syncing…" : "Sync site images"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            Select from library
          </Button>
          <Button
            type="button"
            className="theme-button text-white gap-2"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Upload images
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total images</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Library size</p>
            <p className="text-2xl font-bold text-gray-900">{formatMediaSize(stats.totalSize)}</p>
          </div>
        </div>
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

      <div
        className={`mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/5"
            : "border-gray-300 bg-gray-50/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="font-medium text-gray-800">Drop images here to upload</p>
        <p className="text-sm text-gray-500 mt-1">or click Upload images — multiple files supported</p>
      </div>

      {uploadJobs.length > 0 && (
        <div className="mb-6 space-y-2">
          {uploadJobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="truncate pr-2">{job.name}</span>
                <span className={job.status === "error" ? "text-red-600" : "text-gray-600"}>
                  {job.status === "uploading" ? `${job.progress}%` : job.status === "done" ? "Complete" : "Failed"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    job.status === "error" ? "bg-red-500" : "bg-[var(--theme-primary)]"
                  }`}
                  style={{ width: `${Math.max(job.progress, job.status === "done" ? 100 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search images…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            disabled={deleting}
            onClick={handleDeleteSelected}
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedIds.size})
          </Button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          Showing {items.length} on this page
        </span>
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-20 text-center text-gray-500">
          No images found. Upload your first image above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const id = String(item._id || item.id);
            const selected = selectedIds.has(id);
            const url = resolvePublicAssetUrl(item.url);
            const label = item.originalName || item.filename || "Image";

            return (
              <div
                key={id}
                className={`group relative rounded-xl overflow-hidden border-2 bg-white transition-all ${
                  selected ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/20" : "border-gray-200"
                }`}
              >
                <button type="button" className="block w-full aspect-square" onClick={() => toggleSelect(id)}>
                  <img src={url} alt={item.alt || label} className="w-full h-full object-cover" loading="lazy" />
                </button>
                <button
                  type="button"
                  title="Copy image URL"
                  aria-label="Copy image URL"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void copyMediaUrl(url);
                  }}
                  className="absolute top-2 left-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity w-8 h-8 rounded-md bg-black/65 text-white hover:bg-black/80 flex items-center justify-center shadow"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <div className="p-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-800 truncate">{label}</p>
                  <p className="text-[10px] text-gray-500 truncate" title={url}>
                    {formatMediaSize(item.size)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                  </p>
                  <button
                    type="button"
                    className="mt-1.5 text-[11px] font-medium text-[var(--theme-primary)] hover:underline"
                    onClick={() => void copyMediaUrl(url)}
                  >
                    Copy URL
                  </button>
                </div>
                {selected && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--theme-primary)] text-white text-xs flex items-center justify-center font-bold z-10">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        maxSelection={10}
        onSelect={(selected) => {
          success(`${selected.length} image(s) selected from library.`);
        }}
      />
    </div>
  );
}
