import React from "react";
import { z, ZodIssue } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageCropperModal from "./ImageCropperModal";

interface Category {
  id?: string;
  name: string;
  icon: string;
  iconFile?: File;
  products: number;
  status?: "active" | "inactive";
}

interface CategoryModalProps {
  open: boolean;
  mode: "add" | "edit" | "view";
  data?: Category;
  onClose: () => void;
  onSubmit: (formData: Category) => void;
}

// Zod schema for validation
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  icon: z.string().min(1, "Icon is required"),
  products: z
    .number()
    .int()
    .nonnegative("Products must be 0 or more")
    .optional(),
  status: z.enum(["active", "inactive"]),
});

export default function CategoryModal({
  open,
  mode,
  data,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  const [form, setForm] = React.useState<Category>({
    name: data?.name || "",
    icon: data?.icon || "",
    products: data?.products || 0,
    status: data?.status || "active",
  });

  const [error, setError] = React.useState<{ name?: string; icon?: string; products?: string }>({});
const [cropModalOpen, setCropModalOpen] = React.useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputId = React.useId();

  React.useEffect(() => {
    setForm({
      name: data?.name || "",
      icon: data?.icon || "",
      products: data?.products || 0,
      status: data?.status || "active",
    });
    setError({});
    setSelectedFileForCrop(null);
  }, [data, open]);

  const isView = mode === "view";

   // open cropper when file selected
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileForCrop(file);
    setCropModalOpen(true);
  };

  // when crop done
  const handleCropDone = (croppedBlob: Blob) => {
  const file = new File([croppedBlob], "category.jpg", {
    type: "image/jpeg",
  });

  setForm(prev => ({
    ...prev,
    iconFile: file,                 // real file
    icon: URL.createObjectURL(file) // preview only
  }));

  setCropModalOpen(false);
};

const handleSubmit = async () => {
  if (isSubmitting) return;
  
  // Validate form
  const updatedForm = { ...form, icon: form.icon || "/category.png" };
  const result = categorySchema.safeParse(updatedForm);
  if (!result.success) {
    const issues: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const key = err.path[0] as string;
      if (key) issues[key] = err.message;
    });
    setError(issues);
    return;
  }
  
  setIsSubmitting(true);
  try {
    await Promise.resolve(onSubmit(updatedForm));
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onClose} >
      <DialogContent className=" bg-white text-black">
        <DialogHeader>
          <DialogTitle className="theme-heading">
            {mode === "add" && "Add Category"}
            {mode === "edit" && "Edit Category"}
            {mode === "view" && "View Category"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-900">Name</label>
            <Input
              value={form.name}
              disabled={isView}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={error.name ? "border-red-500" : ""}
            />
            {error.name && <p className="text-red-500 text-sm">{error.name}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-900">Status</label>
            {isView ? (
              <p className="mt-1 text-sm text-gray-800 capitalize">{form.status || "active"}</p>
            ) : (
              <select
                value={form.status || "active"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "active" | "inactive" })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 bg-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            )}
          </div>

          {/* Icon */}
          <div>
            {isView ? (
              <>
                <label className="text-sm font-medium text-gray-900">Icon (1:1) *</label>
                <img
                  src={(form.icon && form.icon.trim() !== "") ? form.icon : "/category.png"}
                  alt="icon"
                  className="w-24 h-24 object-cover rounded mt-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + "/category.png") {
                      target.src = "/category.png";
                    }
                  }}
                />
              </>
            ) : (
              <>
                <input
                  id={fileInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <label
                  htmlFor={fileInputId}
                  className="flex h-12 w-full cursor-pointer items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white transition-colors hover:border-gray-400"
                >
                  <span className="flex min-w-0 flex-1 items-center px-4 text-sm text-gray-700">
                    <span className="truncate">
                      {selectedFileForCrop?.name || "Choose file"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center border-l border-gray-300 bg-gray-50 px-5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Browse
                  </span>
                </label>
                <p className="mt-1 text-sm font-medium text-gray-900">Icon (1:1)</p>
                <img
                  src={(form.icon && form.icon.trim() !== "") ? form.icon : "/category.png"}
                  alt="preview"
                  className="w-24 h-24 object-cover rounded mt-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== window.location.origin + "/category.png") {
                      target.src = "/category.png";
                    }
                  }}
                />
              </>
            )}
            {error.icon && <p className="text-red-500 text-sm">{error.icon}</p>}
          </div>
        </div>
 <ImageCropperModal
          open={cropModalOpen}
          file={selectedFileForCrop}
          onClose={() => setCropModalOpen(false)}
          onCropDone={handleCropDone}
          aspect={1} // always 1:1 for category icon
        />
        {!isView && (
          <DialogFooter>
            <Button className="text-white theme-button" onClick={handleSubmit} loading={isSubmitting}>
              {mode === "add" ? "Add" : "Update"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
