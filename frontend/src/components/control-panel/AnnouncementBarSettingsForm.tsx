import React from "react";
import { Plus, X } from "lucide-react";
import HexColorPickerField from "@/components/ui/HexColorPickerField";
import type {
  AnnouncementBarSettings,
  AnnouncementMessage,
} from "@/utils/announcementBar";

type Props = {
  value: AnnouncementBarSettings;
  onChange: (next: AnnouncementBarSettings) => void;
};

export default function AnnouncementBarSettingsForm({ value, onChange }: Props) {
  const messages = value.messages?.length
    ? value.messages
    : [{ text: "", link: "", order: 0 }];

  const patch = (partial: Partial<AnnouncementBarSettings>) =>
    onChange({ ...value, ...partial });

  const updateMessage = (
    index: number,
    field: keyof AnnouncementMessage,
    fieldValue: string
  ) => {
    const next = messages.map((message, i) =>
      i === index ? { ...message, [field]: fieldValue } : message
    );
    patch({ messages: next });
  };

  const addMessage = () => {
    patch({
      messages: [...messages, { text: "", link: "", order: messages.length }],
    });
  };

  const removeMessage = (index: number) => {
    const next = messages.filter((_, i) => i !== index);
    patch({
      messages: next.length > 0 ? next : [{ text: "", link: "", order: 0 }],
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Shopify-style top bar for promotions, shipping offers, or sale messages. Shown above
        the site header on storefront pages when enabled.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HexColorPickerField
          label="Background color"
          value={value.backgroundColor || ""}
          onChange={(v) => patch({ backgroundColor: v })}
          placeholder="#000000"
          fallback="#000000"
        />
        <HexColorPickerField
          label="Text color"
          value={value.textColor || ""}
          onChange={(v) => patch({ textColor: v })}
          placeholder="#ffffff"
          fallback="#ffffff"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.dismissible !== false}
            onChange={(e) => patch({ dismissible: e.target.checked })}
            className="rounded border-gray-300 theme-checkbox"
          />
          <span className="text-sm text-gray-800">Allow customers to dismiss</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.autoRotate !== false}
            onChange={(e) => patch({ autoRotate: e.target.checked })}
            className="rounded border-gray-300 theme-checkbox"
          />
          <span className="text-sm text-gray-800">Auto-rotate multiple messages</span>
        </label>
      </div>

      <div className="max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rotate every (seconds)
        </label>
        <input
          type="number"
          min={3}
          value={value.rotateIntervalSeconds || 5}
          onChange={(e) =>
            patch({ rotateIntervalSeconds: Math.max(3, Number(e.target.value) || 5) })
          }
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
        />
      </div>

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div
            key={`announcement-${index}`}
            className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-800">Message {index + 1}</p>
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMessage(index)}
                  className="text-gray-500 hover:text-red-600"
                  aria-label={`Remove announcement ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={message.text || ""}
              onChange={(e) => updateMessage(index, "text", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white"
              placeholder="e.g. Free shipping on all orders this week"
            />
            <input
              type="text"
              value={message.link || ""}
              onChange={(e) => updateMessage(index, "link", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none bg-white"
              placeholder="Optional link e.g. /shop or https://example.com"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMessage}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Plus className="w-4 h-4" />
        Add announcement
      </button>
    </div>
  );
}
