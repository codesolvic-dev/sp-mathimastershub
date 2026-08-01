import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: any;
}

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-800 text-sm font-medium">{label}</label>

      <div className="relative">
        <input
          id={label}
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className="w-full rounded-md border border-gray-300 bg-white/70 px-3 py-2 pr-10 text-black focus:outline-none"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--theme-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
        <button
          type="button"
          className="absolute right-3 top-2.5 text-black/60"
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}
