import React, { useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { WelcomePopupSettings } from "@/utils/welcomePopup";

type Props = {
  value: WelcomePopupSettings;
  companyName?: string;
  onChange: (next: WelcomePopupSettings) => void;
  imageInputRef?: React.RefObject<HTMLInputElement | null>;
  onClearImageFlag?: (clear: boolean) => void;
};

export default function WelcomePopupSettingsForm({
  value,
  companyName,
  onChange,
  imageInputRef,
  onClearImageFlag,
}: Props) {
  const localRef = useRef<HTMLInputElement>(null);
  const fileRef = imageInputRef || localRef;

  const patch = (partial: Partial<WelcomePopupSettings>) =>
    onChange({ ...value, ...partial });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onClearImageFlag?.(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      patch({ imageUrl: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (fileRef.current) fileRef.current.value = "";
    onClearImageFlag?.(true);
    patch({ imageUrl: "" });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Horizontal popup shown once per visit when customers open the storefront. Hidden when
        disabled or when maintenance mode is on.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Popup image (optional)
        </label>
        <div className="flex items-start gap-4">
          {value.imageUrl ? (
            <img
              src={value.imageUrl}
              alt="Welcome popup"
              className="w-40 h-28 object-cover border border-gray-200 rounded-lg"
            />
          ) : (
            <div className="w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Upload image
            </button>
            {value.imageUrl ? (
              <button
                type="button"
                onClick={removeImage}
                className="block px-4 py-2 text-sm text-red-600 hover:text-red-700"
              >
                Remove image
              </button>
            ) : null}
            <p className="text-xs text-gray-500">
              Recommended: 600×400 (3:2). Leave empty for text-only popup.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={value.title || ""}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
            placeholder={
              companyName ? `Welcome to ${companyName}` : "Welcome to your store"
            }
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use: Welcome to {companyName || "your store name"}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={value.description || ""}
            onChange={(e) => patch({ description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none resize-y focus:ring-2 focus:ring-[var(--theme-primary)]/25"
            placeholder="Unlock exclusive offers and enjoy a premium shopping experience."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Button label</label>
          <input
            type="text"
            value={value.buttonLabel || "Continue"}
            onChange={(e) => patch({ buttonLabel: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
            placeholder="Continue"
          />
        </div>
      </div>
    </div>
  );
}
