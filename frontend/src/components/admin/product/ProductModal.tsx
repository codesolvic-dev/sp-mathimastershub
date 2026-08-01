import { RichTextEditor } from "@mantine/rte";
import React, { useEffect, useState } from "react";
import { z, ZodIssue } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageCropperModal from "./ImageCropperModal";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { ImageIcon, Upload, Link2 } from "lucide-react";
import { youtubeVideoIdFromUrl } from "@/utils/youtubeEmbed";

type VideoFieldKey = "video1" | "video2";
type VideoInputMode = "youtube" | "file";

function detectVideoMode(url?: string): VideoInputMode {
  const raw = String(url || "").trim();
  if (!raw) return "youtube";
  if (youtubeVideoIdFromUrl(raw)) return "youtube";
  return "file";
}

function isDirectVideoFileUrl(url?: string) {
  const raw = String(url || "").trim();
  if (!raw) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(raw) || raw.includes("video/upload");
}

interface Category {
  _id: string;
  name: string;
}

type Status = "active" | "inactive";

export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string | Category;
  price: number;
  currency: string;
  status: Status;
  discount?: number;
  /** Optional stock-keeping unit (leave empty for no SKU) */
  sku?: string;
  // image URLs (if existing)
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  // meta & videos
  metaFeatures?: string;
  metaInfo?: string;
  video1?: string;
  video2?: string;
  // variations
  hasVariations?: boolean;
  variationConfig?: {
    colors?: string[];
    sizes?: string[];
    customName?: string;
    customValues?: string[];
  };
  variants?: Array<{
    color?: string;
    size?: string;
    customValue?: string;
    price: number;
    stock: number;
    image?: string;
  }>;
}

interface ProductModalProps {
  open: boolean;
  mode: "add" | "edit" | "view";
  categories: Category[];
  data?: Product;
  onClose: () => void;
  onSubmit: (formData: ProductForm) => void | Promise<void>;
  submitting?: boolean;
}

export interface ProductForm extends Product {
  // files for upload (keys image1..image6)
  imageFiles?: Partial<Record<`image${1 | 2 | 3 | 4 | 5 | 6}`, File>>;
  /** PC-uploaded demo videos (video1 / video2) */
  videoFiles?: Partial<Record<"video1" | "video2", File>>;
  category: string | Category;
}


const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.number().nonnegative("Price must be 0 or more"),
  currency: z.string().min(1, "Currency is required"),
  status: z.enum(["active", "inactive"]),
  discount: z.number().min(0).max(100).optional(),
  sku: z.string().optional(),
  image1: z.string().optional(),
  image2: z.string().optional(),
  image3: z.string().optional(),
  image4: z.string().optional(),
  image5: z.string().optional(),
  image6: z.string().optional(),
  metaFeatures: z.string().optional(),
  metaInfo: z.string().optional(),
  video1: z.string().optional(),
  video2: z.string().optional(),
  hasVariations: z.boolean().optional(),
  variationConfig: z.any().optional(),
  variants: z.any().optional(),
});

export default function ProductModal({
  open,
  mode,
  categories,
  data,
  onClose,
  onSubmit,
  submitting = false,
}: ProductModalProps) {
  const isView = mode === "view";
  const { currency: storeCurrency } = useStoreCurrency();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(null);
  const [currentImageKey, setCurrentImageKey] =
    useState<`image${1 | 2 | 3 | 4 | 5 | 6}` | null>(null);
  const [toggles, setToggles] = useState({
    images: true,
    discount: false,
    videos: false,
  });

  const toggleSection = (name: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Variations States
  const [hasVariations, setHasVariations] = useState(false);
  const [variationColors, setVariationColors] = useState<string[]>([]);
  const [variationSizes, setVariationSizes] = useState<string[]>([]);
  const [customVarName, setCustomVarName] = useState<string>("");
  const [customVarValues, setCustomVarValues] = useState<string[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);

  // Input states for adding variations tags/inputs dynamically
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [customValueInput, setCustomValueInput] = useState("");

  const handleAddColor = () => {
    const val = colorInput.trim();
    if (val && !variationColors.includes(val)) {
      setVariationColors(prev => [...prev, val]);
    }
    setColorInput("");
  };

  const handleRemoveColor = (index: number) => {
    setVariationColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSize = () => {
    const val = sizeInput.trim();
    if (val && !variationSizes.includes(val)) {
      setVariationSizes(prev => [...prev, val]);
    }
    setSizeInput("");
  };

  const handleRemoveSize = (index: number) => {
    setVariationSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomValue = () => {
    const val = customValueInput.trim();
    if (val && !customVarValues.includes(val)) {
      setCustomVarValues(prev => [...prev, val]);
    }
    setCustomValueInput("");
  };

  const handleRemoveCustomValue = (index: number) => {
    setCustomVarValues(prev => prev.filter((_, i) => i !== index));
  };

  const generateVariants = () => {
    if (variationColors.length === 0 && variationSizes.length === 0 && customVarValues.length === 0) {
      setVariantsList([]);
      return;
    }

    const newVariants: any[] = [];
    const colorsArr = variationColors.length > 0 ? variationColors : [""];
    const sizesArr = variationSizes.length > 0 ? variationSizes : [""];
    const customValsArr = customVarValues.length > 0 ? customVarValues : [""];

    for (const c of colorsArr) {
      for (const s of sizesArr) {
        for (const cv of customValsArr) {
          const existing = variantsList.find(
            v => v.color === c && v.size === s && v.customValue === cv
          );

          newVariants.push({
            color: c,
            size: s,
            customValue: cv,
            price: existing ? existing.price : form.price,
            stock: existing ? existing.stock : 100,
            image: existing ? existing.image : "",
          });
        }
      }
    }

    setVariantsList(newVariants);
  };

  const [form, setForm] = React.useState<ProductForm>({
    name: data?.name || "",
    description: data?.description || "",
    category: typeof data?.category === "object" ? data.category._id : data?.category || (categories[0]?._id ?? ""),
    price: data?.price || 0,
    currency: storeCurrency,
    status: data?.status || "active",
    discount: data?.discount || 0,
    sku: data?.sku || "",
    image1: data?.image1 || "",
    image2: data?.image2 || "",
    image3: data?.image3 || "",
    image4: data?.image4 || "",
    image5: data?.image5 || "",
    image6: data?.image6 || "",
    metaFeatures: data?.metaFeatures || "",
    metaInfo: data?.metaInfo || "",
    video1: data?.video1 || "",
    video2: data?.video2 || "",
    imageFiles: {},
    videoFiles: {},
  });
  type ImageField = "image1" | "image2" | "image3" | "image4" | "image5" | "image6";

  const [videoModes, setVideoModes] = React.useState<Record<VideoFieldKey, VideoInputMode>>({
    video1: detectVideoMode(data?.video1),
    video2: detectVideoMode(data?.video2),
  });
  const [error, setError] = React.useState<Partial<Record<keyof Product, string>>>({});

  React.useEffect(() => {
    setForm({
      name: data?.name || "",
      description: data?.description || "",
      category: typeof data?.category === "object" ? data.category._id : data?.category || (categories[0]?._id ?? ""),
      price: data?.price || 0,
      currency: storeCurrency,
      status: data?.status || "active",
      discount: data?.discount || 0,
      sku: data?.sku || "",
      image1: data?.image1 || "",
      image2: data?.image2 || "",
      image3: data?.image3 || "",
      image4: data?.image4 || "",
      image5: data?.image5 || "",
      image6: data?.image6 || "",
      metaFeatures: data?.metaFeatures || "",
      metaInfo: data?.metaInfo || "",
      video1: data?.video1 || "",
      video2: data?.video2 || "",
      imageFiles: {},
      videoFiles: {},
    });
    setVideoModes({
      video1: detectVideoMode(data?.video1),
      video2: detectVideoMode(data?.video2),
    });
    setError({});

    // Add product: % Off / Demo Videos start unchecked.
    // Edit/view: open sections only when the product already has that data.
    const hasDiscount = Number(data?.discount || 0) > 0;
    const hasVideos = Boolean(String(data?.video1 || "").trim() || String(data?.video2 || "").trim());
    setToggles({
      images: true,
      discount: mode === "add" ? false : hasDiscount,
      videos: mode === "add" ? false : hasVideos,
    });

    if (data) {
      setHasVariations(data.hasVariations || false);
      setVariationColors(data.variationConfig?.colors || []);
      setVariationSizes(data.variationConfig?.sizes || []);
      setCustomVarName(data.variationConfig?.customName || "");
      setCustomVarValues(data.variationConfig?.customValues || []);
      setVariantsList(data.variants || []);
    } else {
      setHasVariations(false);
      setVariationColors([]);
      setVariationSizes([]);
      setCustomVarName("");
      setCustomVarValues([]);
      setVariantsList([]);
    }
  }, [data, open, storeCurrency, mode]);

  // preview URL helper (prefer file preview if present)
  const previewFor = (key: `image${1 | 2 | 3 | 4 | 5 | 6}`) =>
    (form.imageFiles && (form.imageFiles as any)[key]
      ? URL.createObjectURL((form.imageFiles as any)[key] as File)
      : (form as any)[key]) || "";

  const hasImage = (key: ImageField) =>
    !!(form.imageFiles && (form.imageFiles as any)[key]) || !!(form as any)[key];

  const setVideoMode = (key: VideoFieldKey, mode: VideoInputMode) => {
    setVideoModes((prev) => ({ ...prev, [key]: mode }));
    if (mode === "youtube") {
      setForm((prev) => {
        const nextFiles = { ...(prev.videoFiles || {}) };
        delete nextFiles[key];
        return { ...prev, videoFiles: nextFiles };
      });
    }
  };

  const handleSelectVideoFile = (key: VideoFieldKey, file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError((prev) => ({ ...prev, [key]: "Please select a video file (mp4, webm, mov…)" }));
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setError((prev) => ({ ...prev, [key]: "Video must be smaller than 40MB" }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const fail = (message: string) => {
      URL.revokeObjectURL(objectUrl);
      setError((prev) => ({ ...prev, [key]: message }));
    };

    video.onloadedmetadata = () => {
      const duration = Number(video.duration);
      URL.revokeObjectURL(objectUrl);
      if (!Number.isFinite(duration) || duration <= 0) {
        setError((prev) => ({ ...prev, [key]: "Could not read video duration. Try another file." }));
        return;
      }
      if (duration > 25) {
        setError((prev) => ({
          ...prev,
          [key]: `You can upload only 10–25 second videos (this one is ${Math.ceil(duration)}s)`,
        }));
        return;
      }
      setForm((prev) => ({
        ...prev,
        [key]: "",
        videoFiles: { ...(prev.videoFiles || {}), [key]: file },
      }));
      setError((prev) => ({ ...prev, [key]: undefined }));
    };

    video.onerror = () => fail("Invalid or unsupported video file");
    video.src = objectUrl;
  };

  const clearVideoField = (key: VideoFieldKey) => {
    setForm((prev) => {
      const nextFiles = { ...(prev.videoFiles || {}) };
      delete nextFiles[key];
      return { ...prev, [key]: "", videoFiles: nextFiles };
    });
    setError((prev) => ({ ...prev, [key]: undefined }));
  };

  // const handleSelectFile = (key: `image${1|2|3|4|5|6}`, file?: File) => {
  //   if (!file) return;
  //   // size check (< 1MB)
  //   if (file.size > 1024 * 1024) {
  //     setError(prev => ({ ...prev, [key]: "Image must be smaller than 1MB" }));
  //     return;
  //   }
  //   // aspect ratio validation via Image
  //   const img = new Image();
  //   img.src = URL.createObjectURL(file);
  //   img.onload = () => {
  //     const aspectRatio = img.width / img.height;
  //     if (Math.abs(aspectRatio - 4 / 3) > 0.02) {
  //       setError(prev => ({ ...prev, [key]: "Image must be 4:3 aspect ratio" }));
  //       return;
  //     }
  //     // ok
  //     setForm(prev => ({
  //       ...prev,
  //       imageFiles: { ...(prev.imageFiles || {}), [key]: file },
  //       // set the preview URL in imageX (only for UI; not necessary but useful)
  //       [key]: URL.createObjectURL(file),
  //     } as ProductForm));
  //     setError(prev => ({ ...prev, [key]: undefined }));
  //   };
  //   img.onerror = () => {
  //     setError(prev => ({ ...prev, [key]: "Invalid image file" }));
  //   };
  // };

  const handleSelectFile = (key: `image${1 | 2 | 3 | 4 | 5 | 6}`, file?: File) => {
    if (!file) return;

    setCurrentImageKey(key);       // किस image के लिए crop हो रहा है
    setSelectedFileForCrop(file);  // cropper को भेजने के लिए file
    setCropModalOpen(true);        // modal open
  };

  const handleCropDone = (croppedBlob: Blob) => {
    if (!currentImageKey) return;

    const file = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });

    // validate size <1MB
    if (file.size > 1024 * 1024) {
      setError(prev => ({ ...prev, [currentImageKey]: "Image must be smaller than 1MB" }));
      return;
    }

    // validate aspect ratio
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const aspectRatio = img.width / img.height;

      if (Math.abs(aspectRatio - 3 / 4) > 0.02) {
        setError(prev => ({ ...prev, [currentImageKey]: "Image must be 3:4 aspect ratio" }));
        return;
      }

      // Save into form
      setForm(prev => ({
        ...prev,
        imageFiles: { ...(prev.imageFiles || {}), [currentImageKey]: file },
        [currentImageKey]: url, // preview
      }));

      setError(prev => ({ ...prev, [currentImageKey]: undefined }));
    };

    img.src = url;

    setCropModalOpen(false);
  };


  const handleRemoveImage = (key: `image${1 | 2 | 3 | 4 | 5 | 6}`) => {
    setForm(prev => {
      const newFiles = { ...(prev.imageFiles || {}) };
      delete (newFiles as any)[key];
      return {
        ...prev,
        imageFiles: newFiles,
        [key]: "", // remove preview / url
      } as ProductForm;
    });
    setError(prev => ({ ...prev, [key]: undefined }));
  };

  // const handleSubmit = () => {
  //   const categoryId = typeof form.category === "object" ? form.category._id : form.category;

  //   const candidate = { ...form, category: categoryId };

  //   const result = productSchema.safeParse(candidate);
  //   if (!result.success) {
  //     const issues: Partial<Record<keyof Product, string>> = {};
  //     result.error.issues.forEach((err: ZodIssue) => {
  //       const key = err.path[0] as keyof Product;
  //       if (key) issues[key] = err.message;
  //     });
  //     setError(issues);
  //     return;
  //   }

  //   if (mode === "add") {
  //     const hasFile1 = !!(form.imageFiles && (form.imageFiles as any).image1);
  //     const hasUrl1 = !!form.image1;
  //     if (!hasFile1 && !hasUrl1) {
  //       setError(prev => ({ ...prev, image1: "Primary image is required" }));
  //       return;
  //     }
  //   }

  //   // ✅ Final payload
  //   const payload: ProductForm = {
  //     ...form,
  //     category: categoryId,       // string ID
  //     metaInfo: form.metaInfo,    // HTML string
  //   };

  //   console.log("Sending payload:", payload);
  //   onSubmit(payload);
  // };


  const handleSubmit = async () => {
    // Convert category to string ID if it's an object
    const categoryId = typeof form.category === "object" ? form.category._id : form.category;

    // Prepare candidate for validation
    const candidate = { ...form, category: categoryId };

    // Validate using Zod
    const result = productSchema.safeParse(candidate);
    if (!result.success) {
      const issues: Partial<Record<keyof Product, string>> = {};
      result.error.issues.forEach((err: ZodIssue) => {
        const key = err.path[0] as keyof Product;
        if (key) issues[key] = err.message;
      });
      setError(issues);
      return;
    }

    // Ensure primary image exists in add mode
    if (mode === "add") {
      const hasFile1 = !!(form.imageFiles && (form.imageFiles as any).image1);
      const hasUrl1 = !!form.image1;
      if (!hasFile1 && !hasUrl1) {
        setError(prev => ({ ...prev, image1: "Primary image is required" }));
        return;
      }
    }

    if (toggles.videos) {
      const hasV1File = !!form.videoFiles?.video1;
      const hasV1Url = !!String(form.video1 || "").trim();
      if (!hasV1File && !hasV1Url) {
        setError((prev) => ({
          ...prev,
          video1: "Add a YouTube URL or select a video from your PC",
        }));
        return;
      }
      if (videoModes.video1 === "youtube" && hasV1Url && !youtubeVideoIdFromUrl(form.video1 || "")) {
        setError((prev) => ({ ...prev, video1: "Enter a valid YouTube URL" }));
        return;
      }
    }

    // Final payload
    const payload: ProductForm = {
      ...form,
      category: categoryId,       // string ID
      metaInfo: form.metaInfo,    // HTML string
      discount: toggles.discount ? form.discount : 0,
      video1: toggles.videos ? form.video1 : "",
      video2: toggles.videos ? form.video2 : "",
      videoFiles: toggles.videos ? form.videoFiles : {},
      hasVariations,
      variationConfig: {
        colors: variationColors,
        sizes: variationSizes,
        customName: customVarName.trim(),
        customValues: customVarValues,
      },
      variants: variantsList,
    };

    console.log("Sending payload:", payload);

    await onSubmit(payload);
  };




  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!flex w-[calc(100vw-32px)] max-w-[780px] sm:max-w-[780px] max-h-[90vh] flex-col gap-0 overflow-hidden bg-white p-0 text-black">
        <DialogHeader className="shrink-0 px-5 pt-5 pr-12">
          <DialogTitle className="text-gray-900">
            {mode === "add" && "Add Product"}
            {mode === "edit" && "Edit Product"}
            {mode === "view" && "View Product"}

          </DialogTitle>
          <DialogDescription className="pt-2 text-gray-700">
            Fill in all product details below.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 space-y-5">
          {/* Top row: name */}
          <div>
            <label className="text-sm font-medium text-gray-900">Product Title</label>
            <Input
              value={form.name}
              disabled={isView}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={error.name ? "border-red-500" : ""}
            />
            {error.name && <p className="text-red-500 text-sm">{error.name}</p>}
          </div>

          {/* Category / Price / Currency / SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-900">Category</label>
              <select
                value={typeof form.category === "string" ? form.category : form.category._id}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={isView}
                className="border rounded p-2 w-full"
              >

                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {error.category && <p className="text-red-500 text-sm">{error.category}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Price</label>
              <Input
                type="number"
                value={form.price}
                disabled={isView}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className={error.price ? "border-red-500" : ""}
              />
              {error.price && <p className="text-red-500 text-sm">{error.price}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Store currency</label>
              <div className="border rounded p-2 w-full bg-gray-50 text-gray-700">
                {storeCurrency}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set in Developer → Company. All products use this currency.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">
                SKU <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <Input
                value={form.sku || ""}
                disabled={isView}
                placeholder="No SKU"
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if not needed.</p>
            </div>
          </div>

          {/* Description — product detail "Description" tab */}
          <div>
            <label className="text-sm font-medium text-gray-900">Description</label>
            <p className="text-xs text-gray-500 mb-1">Shows on the product detail page → Description tab.</p>
            <Textarea
              value={form.description}
              disabled={isView}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`w-full text-left min-h-32 ${error.description ? "border-red-500" : ""}`}
            />
            {error.description && <p className="text-red-500 text-sm">{error.description}</p>}
          </div>

          {/* Returns & Exchange + Care Instructions — product detail tabs */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Product detail page tabs</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Optional content for Returns &amp; Exchange and Care Instructions tabs on the storefront.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Returns &amp; Exchange</label>
              <RichTextEditor
                value={form.metaFeatures || ""}
                readOnly={isView}
                onChange={(value) => setForm({ ...form, metaFeatures: value })}
                className="w-full bg-white text-gray-900 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">Care Instructions</label>
              <RichTextEditor
                value={form.metaInfo || ""}
                readOnly={isView}
                onChange={(value) => setForm({ ...form, metaInfo: value })}
                className="w-full bg-white text-gray-900 mt-1"
              />
            </div>
          </div>

          {/* % Off + Sale Rate simplified (left as inputs) */}
          <div className="border-t pt-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={toggles.discount}
                onChange={() => toggleSection("discount")}
                disabled={isView}
              />

              <span className="text-sm font-medium text-gray-900">% Off</span>
            </label>
            {toggles.discount && (
              <div className="flex gap-3 mt-2 items-center">
                <Input
                  type="number"
                  value={form.discount}
                  disabled={isView}
                  onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  className="flex-1 max-w-[120px]"
                  placeholder="%"
                />
                {(form.discount ?? 0) > 0 && form.price > 0 && (
                  <span className="text-sm text-gray-600">
                    Sale price: {Math.round(form.price - (form.price * (form.discount ?? 0)) / 100)}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Images grid — main 360×360 + 2×2 side thumbs */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center gap-2 mb-5">
              <input
                type="checkbox"
                checked={toggles.images}
                onChange={() => toggleSection("images")}
                disabled={isView}
                className="rounded border-gray-300"
              />
              <span className="font-semibold text-gray-900">Images</span>
            </div>
            {toggles.images && (
              <div className="flex flex-col sm:flex-row gap-5">
                {/* MAIN LARGE IMAGE (image1) — 360×360 */}
                <div
                  className="relative group w-full sm:w-[360px] sm:shrink-0 cursor-pointer"
                  onClick={() => !isView && document.getElementById("file-image1")?.click()}
                >
                  <div className="w-full aspect-square sm:w-[360px] sm:h-[360px] bg-gray-100 rounded-md overflow-hidden border border-gray-300 flex items-center justify-center">
                    {hasImage("image1") ? (
                      <img src={previewFor("image1")} alt="Main" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-white drop-shadow-sm" strokeWidth={1.25} />
                    )}
                  </div>

                  {!isView && hasImage("image1") && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage("image1");
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  )}

                  <input
                    id="file-image1"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSelectFile("image1", e.target.files?.[0])}
                  />

                  {error.image1 && <p className="text-red-500 text-sm mt-1">{error.image1}</p>}
                </div>

                {/* RIGHT-SIDE 2×2 — fills same 360 height */}
                <div className="grid grid-cols-2 gap-5 w-full sm:w-[360px] sm:h-[360px]">
                  {[2, 3, 4, 5].map((n) => {
                    const key = `image${n}` as ImageField;
                    return (
                      <div
                        key={n}
                        className="relative group cursor-pointer min-h-0 bg-gray-100 rounded-md border border-gray-300 overflow-hidden flex items-center justify-center"
                        onClick={() => !isView && document.getElementById(`file-image${n}`)?.click()}
                      >
                        {hasImage(key) ? (
                          <img
                            src={previewFor(key)}
                            alt={`Image ${n}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-white drop-shadow-sm" strokeWidth={1.25} />
                        )}

                        {!isView && hasImage(key) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(key);
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        )}

                        <input
                          id={`file-image${n}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSelectFile(key, e.target.files?.[0])}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <ImageCropperModal
            open={cropModalOpen}
            onClose={() => setCropModalOpen(false)}
            file={selectedFileForCrop}
            onCropDone={handleCropDone}
            aspect={3 / 4}
          />


          {/* Demo Videos */}
          <div className="w-full border-t border-gray-200 pt-5">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={toggles.videos}
                onChange={() => toggleSection("videos")}
                disabled={isView}
                className="rounded border-gray-300"
              />
              <span className="font-semibold text-gray-900">Demo Videos</span>
            </div>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-5">
              You can upload only <span className="font-semibold">10–25 second</span> videos (PC upload). Longer videos will be rejected.
            </p>

            {toggles.videos && (
              <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-5">
                {(["video1", "video2"] as VideoFieldKey[]).map((key) => {
                  const label = key === "video1" ? "Video 1" : "Video 2 (optional)";
                  const mode = videoModes[key];
                  const file = form.videoFiles?.[key];
                  const url = String((form as any)[key] || "").trim();
                  const hasExistingFile = !file && isDirectVideoFileUrl(url);
                  return (
                    <div key={key} className="space-y-2.5 rounded-lg border border-gray-200 p-3.5 bg-gray-50/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">{label}</span>
                        {key === "video1" && toggles.videos ? (
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">Required</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isView}
                          onClick={() => setVideoMode(key, "youtube")}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                            mode === "youtube"
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          YouTube URL
                        </button>
                        <button
                          type="button"
                          disabled={isView}
                          onClick={() => setVideoMode(key, "file")}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                            mode === "file"
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Select from PC
                        </button>
                      </div>

                      {mode === "youtube" ? (
                        <Input
                          placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
                          value={url}
                          disabled={isView}
                          required={key === "video1" && toggles.videos}
                          className="w-full bg-white"
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value, videoFiles: { ...(form.videoFiles || {}), [key]: undefined } })
                          }
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isView}
                              className="bg-white"
                              onClick={() => document.getElementById(`file-${key}`)?.click()}
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              {file || hasExistingFile ? "Change video" : "Choose video"}
                            </Button>
                            {(file || url) && !isView ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => clearVideoField(key)}
                              >
                                Remove
                              </Button>
                            ) : null}
                            <input
                              id={`file-${key}`}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*"
                              className="hidden"
                              disabled={isView}
                              onChange={(e) => {
                                handleSelectVideoFile(key, e.target.files?.[0] || null);
                                e.target.value = "";
                              }}
                            />
                          </div>
                          {file ? (
                            <p className="text-xs text-gray-600 truncate">
                              Selected: <span className="font-medium text-gray-900">{file.name}</span>
                            </p>
                          ) : hasExistingFile ? (
                            <p className="text-xs text-gray-600 truncate">
                              Current: <a href={url} target="_blank" rel="noreferrer" className="underline text-gray-900">uploaded video</a>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">MP4 / WebM / MOV · only 10–25 seconds · max 40MB</p>
                          )}
                        </div>
                      )}

                      {error[key] ? <p className="text-red-500 text-sm">{error[key]}</p> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Variations Section */}
          <div className="w-full border-t border-gray-200 pt-5">
            <label className="flex items-center gap-2 mb-5">
              <input
                type="checkbox"
                checked={hasVariations}
                disabled={isView}
                onChange={(e) => setHasVariations(e.target.checked)}
              />
              <span className="font-semibold text-gray-900">Product Variations (Optional)</span>
            </label>

            {hasVariations && (
              <div className="w-full bg-gray-50 border rounded-lg p-5 space-y-5">
                <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Colors tag input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Colors</label>
                    <div className="flex min-w-0 gap-2">
                      <Input
                        placeholder="Add color (e.g. Red)"
                        value={colorInput}
                        disabled={isView}
                        className="min-w-0 flex-1"
                        onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddColor();
                          }
                        }}
                      />
                      {!isView && (
                        <Button
                          type="button"
                          onClick={handleAddColor}
                          className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold h-10 w-10 flex items-center justify-center rounded-lg shadow-sm transition-colors"
                        >
                          +
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {variationColors.map((color, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-200">
                          {color}
                          {!isView && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="text-purple-500 hover:text-purple-800 font-bold ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sizes tag input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Sizes</label>
                    <div className="flex min-w-0 gap-2">
                      <Input
                        placeholder="Add size (e.g. S, M, L)"
                        value={sizeInput}
                        disabled={isView}
                        className="min-w-0 flex-1"
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSize();
                          }
                        }}
                      />
                      {!isView && (
                        <Button
                          type="button"
                          onClick={handleAddSize}
                          className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold h-10 w-10 flex items-center justify-center rounded-lg shadow-sm transition-colors"
                        >
                          +
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {variationSizes.map((size, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-200">
                          {size}
                          {!isView && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(index)}
                              className="text-purple-500 hover:text-purple-800 font-bold ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-5 border-t pt-5">
                  {/* Custom Variation Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Custom Variation Name</label>
                    <Input
                      placeholder="e.g. Material or Storage"
                      value={customVarName}
                      disabled={isView}
                      className="w-full"
                      onChange={(e) => setCustomVarName(e.target.value)}
                    />
                  </div>

                  {/* Custom Variation Values */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Custom Values</label>
                    <div className="flex min-w-0 gap-2">
                      <Input
                        placeholder="Add value (e.g. Leather, 128GB)"
                        value={customValueInput}
                        disabled={isView}
                        className="min-w-0 flex-1"
                        onChange={(e) => setCustomValueInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomValue();
                          }
                        }}
                      />
                      {!isView && (
                        <Button
                          type="button"
                          onClick={handleAddCustomValue}
                          className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold h-10 w-10 flex items-center justify-center rounded-lg shadow-sm transition-colors"
                        >
                          +
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {customVarValues.map((val, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-200">
                          {val}
                          {!isView && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomValue(index)}
                              className="text-purple-500 hover:text-purple-800 font-bold ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {!isView && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-sm font-semibold border-[#22c55e] text-[#16a34a] hover:bg-[#f0fdf4] hover:text-[#15803d] transition-colors rounded-lg px-4 py-2 flex items-center justify-center gap-1"
                      onClick={() => {
                        setVariantsList(prev => [
                          ...prev,
                          {
                            color: variationColors[0] || "",
                            size: variationSizes[0] || "",
                            customValue: customVarValues[0] || "",
                            price: form.price || 0,
                            stock: 100,
                            image: ""
                          }
                        ]);
                      }}
                    >
                      + Add Custom Variant Row
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="text-sm font-semibold border-[#c084fc] text-[#9333ea] hover:bg-[#faf5ff] hover:text-[#7e22ce] transition-colors rounded-lg px-4 py-2 flex items-center justify-center"
                      onClick={generateVariants}
                    >
                      Generate / Update Variations Grid
                    </Button>
                  </div>
                )}

                {variantsList.length > 0 && (
                  <div className="border-t pt-5">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                      Variations Pricing & Stock
                    </h4>
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                      {variantsList.map((item, idx) => {
                        const comboTitle = [item.color, item.size, item.customValue]
                          .filter(Boolean)
                          .join(" / ");

                        const fieldClass =
                          "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/20 disabled:bg-gray-50";

                        return (
                          <div
                            key={idx}
                            className="relative bg-white border border-gray-300 rounded-lg p-4 space-y-3"
                          >
                            {!isView && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVariantsList((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full w-6 h-6 flex items-center justify-center border border-red-300 shadow-sm"
                                title="Remove Variant"
                              >
                                –
                              </button>
                            )}

                            <p className="text-sm font-semibold text-gray-900 pr-6">
                              {comboTitle || "Custom Variant"}
                            </p>

                            <div
                              className={`grid grid-cols-2 gap-3 ${
                                customVarName ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"
                              }`}
                            >
                              {/* Color */}
                              <div className="min-w-0 space-y-1.5">
                                <label className="block text-xs font-medium text-gray-600">Color</label>
                                {variationColors.length > 0 ? (
                                  <select
                                    className={fieldClass}
                                    value={item.color || ""}
                                    disabled={isView}
                                    onChange={(e) => {
                                      const updated = [...variantsList];
                                      updated[idx].color = e.target.value;
                                      setVariantsList(updated);
                                    }}
                                  >
                                    <option value="">None</option>
                                    {variationColors.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Color"
                                    className={fieldClass}
                                    value={item.color || ""}
                                    disabled={isView}
                                    onChange={(e) => {
                                      const updated = [...variantsList];
                                      updated[idx].color = e.target.value;
                                      setVariantsList(updated);
                                    }}
                                  />
                                )}
                              </div>

                              {/* Size */}
                              <div className="min-w-0 space-y-1.5">
                                <label className="block text-xs font-medium text-gray-600">Size</label>
                                {variationSizes.length > 0 ? (
                                  <select
                                    className={fieldClass}
                                    value={item.size || ""}
                                    disabled={isView}
                                    onChange={(e) => {
                                      const updated = [...variantsList];
                                      updated[idx].size = e.target.value;
                                      setVariantsList(updated);
                                    }}
                                  >
                                    <option value="">None</option>
                                    {variationSizes.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Size"
                                    className={fieldClass}
                                    value={item.size || ""}
                                    disabled={isView}
                                    onChange={(e) => {
                                      const updated = [...variantsList];
                                      updated[idx].size = e.target.value;
                                      setVariantsList(updated);
                                    }}
                                  />
                                )}
                              </div>

                              {/* Custom Value */}
                              {customVarName && (
                                <div className="min-w-0 space-y-1.5">
                                  <label className="block text-xs font-medium text-gray-600">
                                    {customVarName}
                                  </label>
                                  {customVarValues.length > 0 ? (
                                    <select
                                      className={fieldClass}
                                      value={item.customValue || ""}
                                      disabled={isView}
                                      onChange={(e) => {
                                        const updated = [...variantsList];
                                        updated[idx].customValue = e.target.value;
                                        setVariantsList(updated);
                                      }}
                                    >
                                      <option value="">None</option>
                                      {customVarValues.map((v) => (
                                        <option key={v} value={v}>
                                          {v}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Value"
                                      className={fieldClass}
                                      value={item.customValue || ""}
                                      disabled={isView}
                                      onChange={(e) => {
                                        const updated = [...variantsList];
                                        updated[idx].customValue = e.target.value;
                                        setVariantsList(updated);
                                      }}
                                    />
                                  )}
                                </div>
                              )}

                              {/* Price */}
                              <div className="min-w-0 space-y-1.5">
                                <label className="block text-xs font-medium text-gray-600">Price</label>
                                <input
                                  type="number"
                                  className={fieldClass}
                                  value={item.price}
                                  disabled={isView}
                                  onChange={(e) => {
                                    const updated = [...variantsList];
                                    updated[idx].price = Number(e.target.value);
                                    setVariantsList(updated);
                                  }}
                                />
                              </div>

                              {/* Stock */}
                              <div className="min-w-0 space-y-1.5">
                                <label className="block text-xs font-medium text-gray-600">Stock</label>
                                <input
                                  type="number"
                                  className={fieldClass}
                                  value={item.stock}
                                  disabled={isView}
                                  onChange={(e) => {
                                    const updated = [...variantsList];
                                    updated[idx].stock = Number(e.target.value);
                                    setVariantsList(updated);
                                  }}
                                />
                              </div>
                            </div>

                            {/* Image */}
                            <div className="min-w-0 space-y-1.5">
                              <label className="block text-xs font-medium text-gray-600">Image</label>
                              <select
                                className={fieldClass}
                                value={item.image || ""}
                                disabled={isView}
                                onChange={(e) => {
                                  const updated = [...variantsList];
                                  updated[idx].image = e.target.value;
                                  setVariantsList(updated);
                                }}
                              >
                                <option value="">Default Product Image</option>
                                {form.image1 && <option value={form.image1}>Main Image 1</option>}
                                {form.image2 && <option value={form.image2}>Image 2</option>}
                                {form.image3 && <option value={form.image3}>Image 3</option>}
                                {form.image4 && <option value={form.image4}>Image 4</option>}
                                {form.image5 && <option value={form.image5}>Image 5</option>}
                                {form.image6 && <option value={form.image6}>Image 6</option>}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {!isView && (
          <DialogFooter className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4">
            <Button
              className="text-white theme-button"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              {mode === "add" ? "Add" : "Update"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}