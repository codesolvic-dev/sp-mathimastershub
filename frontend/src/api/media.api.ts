import API from "./axios";

export type MediaItem = {
  _id: string;
  id?: string;
  url: string;
  publicId?: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  alt?: string;
  folder?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaListResponse = {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MediaStats = {
  total: number;
  totalSize: number;
};

export type UploadProgressHandler = (progress: number, fileName: string) => void;

export async function getMediaStats(): Promise<MediaStats> {
  const res = await API.get("/media/stats");
  return res.data?.data ?? { total: 0, totalSize: 0 };
}

export async function getMedia(params?: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<MediaListResponse> {
  const res = await API.get("/media", { params });
  return (
    res.data?.data ?? {
      items: [],
      total: 0,
      page: 1,
      limit: 24,
      totalPages: 1,
    }
  );
}

export async function uploadMediaFiles(
  files: File[],
  onProgress?: UploadProgressHandler
): Promise<MediaItem[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await API.post("/media", formData, {
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      const pct = Math.round((event.loaded * 100) / event.total);
      onProgress(pct, files.length === 1 ? files[0].name : `${files.length} files`);
    },
  });

  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function deleteMedia(id: string): Promise<void> {
  await API.delete(`/media/${id}`);
}

export async function syncWebsiteMedia(): Promise<{
  imported: number;
  skipped: number;
  total: number;
  libraryTotal: number;
}> {
  const res = await API.post("/media/sync");
  return res.data?.data ?? { imported: 0, skipped: 0, total: 0, libraryTotal: 0 };
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaItem> {
  const res = await API.patch(`/media/${id}`, { alt });
  return res.data?.data;
}

export function formatMediaSize(bytes?: number): string {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
