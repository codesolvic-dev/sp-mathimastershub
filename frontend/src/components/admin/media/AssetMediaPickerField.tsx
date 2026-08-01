import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import MediaPickerModal from "@/components/admin/media/MediaPickerModal";
import type { MediaItem } from "@/api/media.api";
import { resolvePublicAssetUrl } from "@/utils/mediaUrl";
import { ImageIcon, Upload } from "lucide-react";

type AssetMediaPickerFieldProps = {
  label?: string;
  recommendedSize?: string;
  preview: string | null;
  accept?: string;
  allowLibrary?: boolean;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  previewAspectRatio?: number;
  previewIsVideo?: boolean;
};

async function mediaUrlToFile(item: MediaItem): Promise<File> {
  const url = resolvePublicAssetUrl(item.url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load image");
  const blob = await res.blob();
  const name = item.originalName || item.filename || "library-image.jpg";
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export default function AssetMediaPickerField({
  label = "Image",
  recommendedSize,
  preview,
  accept = "image/*",
  allowLibrary = true,
  onFileSelected,
  onClear,
  previewAspectRatio = 16 / 9,
  previewIsVideo = false,
}: AssetMediaPickerFieldProps) {
  const { error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const handleLibrarySelect = async (items: MediaItem[]) => {
    const item = items[0];
    if (!item?.url) return;
    setLoadingLibrary(true);
    try {
      const file = await mediaUrlToFile(item);
      onFileSelected(file);
      setLibraryOpen(false);
    } catch {
      error("Could not load image from media library.");
    } finally {
      setLoadingLibrary(false);
    }
  };

  if (preview) {
    return (
      <div>
        {label && <label className="block text-sm font-medium mb-2">{label}</label>}
        <div className="relative">
          <div
            className="w-full max-w-xl overflow-hidden rounded border bg-gray-50"
            style={{ aspectRatio: previewAspectRatio }}
          >
            {previewIsVideo ? (
              <video src={preview} className="w-full h-full object-cover" controls muted />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
          {recommendedSize ? ` (recommended: ${recommendedSize})` : ""}
        </label>
      )}
      {recommendedSize && !label.includes("recommended") && (
        <p className="text-xs text-gray-500 mb-2">Recommended size: {recommendedSize}</p>
      )}

      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 p-6 text-center">
        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium text-gray-800 mb-1">Add image</p>
        <p className="text-xs text-gray-500 mb-4">Choose from your media library or upload from computer</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {allowLibrary && (
            <Button
              type="button"
              variant="outline"
              disabled={loadingLibrary}
              onClick={() => setLibraryOpen(true)}
              className="gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              {loadingLibrary ? "Loading…" : "Select from library"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload from computer
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />

      {allowLibrary && (
        <MediaPickerModal
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          title="Select image from media library"
          onSelect={handleLibrarySelect}
        />
      )}
    </div>
  );
}
