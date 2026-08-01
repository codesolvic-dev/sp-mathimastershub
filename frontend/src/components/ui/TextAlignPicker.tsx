import React from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export type TextAlignValue = "left" | "center" | "right";

const OPTIONS: { value: TextAlignValue; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "Align left", Icon: AlignLeft },
  { value: "center", label: "Align center", Icon: AlignCenter },
  { value: "right", label: "Align right", Icon: AlignRight },
];

type TextAlignPickerProps = {
  value: string;
  onChange: (value: TextAlignValue) => void;
};

export default function TextAlignPicker({ value, onChange }: TextAlignPickerProps) {
  const selected = (["left", "center", "right"].includes(value) ? value : "center") as TextAlignValue;

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-0.5">
      {OPTIONS.map(({ value: opt, label, Icon }) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            title={label}
            aria-label={label}
            aria-pressed={isSelected}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              isSelected
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
