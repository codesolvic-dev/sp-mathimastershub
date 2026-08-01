import React from "react";

function normalizeHexForPicker(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/^#(.)(.)(.)$/) || [];
    if (r && g && b) return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

type HexColorPickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fallback?: string;
};

export default function HexColorPickerField({
  label,
  value,
  onChange,
  placeholder = "#000000",
  fallback = "#000000",
}: HexColorPickerFieldProps) {
  const pickerValue = normalizeHexForPicker(value || fallback, fallback);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex h-14 w-full items-center overflow-hidden rounded-xl border border-gray-300 bg-gray-50 transition-shadow focus-within:border-[var(--theme-primary)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/20">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 self-stretch border-0 bg-transparent px-5 text-lg font-semibold uppercase text-slate-600 outline-none"
          placeholder={placeholder}
          spellCheck={false}
        />
        <label
          className="relative mr-3 size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-black/10 shadow-sm"
          style={{ backgroundColor: pickerValue }}
          aria-label={`${label} picker`}
        >
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={`${label} picker`}
          />
        </label>
      </div>
    </div>
  );
}
