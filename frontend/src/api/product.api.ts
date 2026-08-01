import API from "./axios"; // your axios instance

// Derive API base URL from VITE_API_URLS (same as axios) so one env var works in Vercel
const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((u: string) => u.trim()).filter(Boolean);
const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const apiUrl = urls.length ? (isLocalhost ? urls[0] : (urls[1] || urls[0])) : (import.meta.env.VITE_API_URL || "");
const BASE_URL = apiUrl ? String(apiUrl).replace("/api", "") : "";

const mapImages = (p: any) => {
  const getFull = (img: string | null) => {
    if (!img || img.trim() === "") return "/product.png";
    if (img.startsWith("http") || img === "/product.png") return img;
    return `${BASE_URL}${img}`;
  };

  return {
    ...p,
    image1: getFull(p.image1),
    image2: getFull(p.image2),
    image3: getFull(p.image3),
    image4: getFull(p.image4),
    image5: getFull(p.image5),
    image6: getFull(p.image6),
  };
};

export const getProducts = async (options?: { fresh?: boolean; activeOnly?: boolean }) => {
  const res = await API.get("/products", {
    params: {
      ...(options?.fresh ? { _t: Date.now() } : {}),
      ...(options?.activeOnly ? { activeOnly: true } : {}),
    },
  });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];
  return list.map(mapImages);
};

export const getProduct = async (id: string) => {
  const res = await API.get(`/products/${id}`);
  return mapImages(res.data.data);
};

/** Increment view count when a visitor opens the product detail page */
export const incrementProductView = async (id: string): Promise<number | null> => {
  try {
    const res = await API.post(`/products/${id}/view`);
    return res.data?.data?.views ?? null;
  } catch {
    return null;
  }
};

/** Increment share count when a visitor shares the product */
export const incrementProductShare = async (id: string): Promise<number | null> => {
  try {
    const res = await API.post(`/products/${id}/share`);
    return res.data?.data?.shares ?? null;
  } catch {
    return null;
  }
};

// ---------------- CREATE PRODUCT ----------------
export const createProduct = async (product: any) => {
  const formData = new FormData();

  Object.entries(product).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    // Skip image files for now
    if (key === "imageFiles" || key === "videoFiles") return;

    // If value is a File, append directly
    if (value instanceof File) {
      formData.append(key, value);
    } 
    // For numbers, convert to string
    else if (typeof value === "number") {
      formData.append(key, value.toString());
    } 
    // For arrays or objects, stringify
    else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } 
    // Otherwise, append as string
    else {
      formData.append(key, String(value));
    }
  });

  // Append image files
  if (product.imageFiles) {
    Object.entries(product.imageFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });
  }

  // Append video files (PC upload for demo reels)
  if (product.videoFiles) {
    Object.entries(product.videoFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });
  }

  const res = await API.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};

// ---------------- UPDATE PRODUCT ----------------
export const updateProduct = async (id: string | number, product: any) => {
  const formData = new FormData();

  Object.entries(product).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "imageFiles" || key === "videoFiles") return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "number") {
      formData.append(key, value.toString());
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  if (product.imageFiles) {
    Object.entries(product.imageFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });
  }

  if (product.videoFiles) {
    Object.entries(product.videoFiles).forEach(([key, file]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });
  }

  const res = await API.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data;
};

export type ProductStatus = "active" | "inactive";

export const updateProductStatus = async (id: string | number, status: ProductStatus) => {
  const res = await API.patch(`/products/${id}/status`, { status });
  return res.data.data;
};

// ---------------- DELETE PRODUCT ----------------
export const deleteProduct = async (id: string | number) => {
  const res = await API.delete(`/products/${id}`);
  return res.data.success;
};

export type ProductImportResult = {
  created: number;
  updated: number;
  skipped: number;
  totalRows: number;
  message?: string;
  errors?: { row: number; message: string }[];
};

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Shopify-style CSV export of all products */
export const exportProductsCsv = async () => {
  const res = await API.get("/products/export/csv", { responseType: "blob" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(res.data, `products-export-${stamp}.csv`);
};

/** Download blank CSV template for import */
export const downloadProductImportTemplate = async () => {
  const res = await API.get("/products/import/template", { responseType: "blob" });
  downloadBlob(res.data, "product-import-template.csv");
};

/** Import products from CSV (create / update by ID or SKU) */
export const importProductsCsv = async (file: File): Promise<ProductImportResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/products/import/csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data as ProductImportResult;
};
