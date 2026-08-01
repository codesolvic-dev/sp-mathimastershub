import React from "react";

function GridIcon({ count, isSelected }: { count: number; isSelected: boolean }) {
  const color = isSelected ? "var(--theme-primary)" : "#6B7280";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {count === 3 && (
        <>
          <rect x="2" y="2" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="10" y="2" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="18" y="2" width="4" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="2" y="10" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="10" y="10" width="6" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="18" y="10" width="4" height="6" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
        </>
      )}
      {count === 4 && (
        <>
          <rect x="1" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="7" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="13" y="1" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="19" y="1" width="4" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="1" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="7" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="13" y="7.5" width="4.5" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
          <rect x="19" y="7.5" width="4" height="4.5" stroke={color} strokeWidth="1.5" fill="none" rx="1" />
        </>
      )}
      {count === 5 && (
        <>
          <rect x="0.5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="9.5" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="14" y="0.5" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="18.5" y="0.5" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="0.5" y="6" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="5" y="6" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="9.5" y="6" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="14" y="6" width="4" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
          <rect x="18.5" y="6" width="5" height="4" stroke={color} strokeWidth="1.5" fill="none" rx="0.5" />
        </>
      )}
    </svg>
  );
}

type GridColumnPickerProps = {
  value: string;
  onChange: (value: string) => void;
  options?: number[];
};

export default function GridColumnPicker({
  value,
  onChange,
  options = [3, 4, 5],
}: GridColumnPickerProps) {
  const selected = Number(value) || options[options.length - 1];

  return (
    <div className="flex gap-3">
      {options.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onChange(String(num))}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            selected === num
              ? "border-[var(--theme-primary)] bg-[color-mix(in_srgb,var(--theme-primary)_10%,white)]"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
          title={`${num} columns`}
        >
          <GridIcon count={num} isSelected={selected === num} />
        </button>
      ))}
    </div>
  );
}
