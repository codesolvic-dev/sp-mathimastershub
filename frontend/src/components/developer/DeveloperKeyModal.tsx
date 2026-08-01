import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DEVELOPER_KEY = "14253611";
const KEY_LENGTH = DEVELOPER_KEY.length;
const MASK_CHAR = "x";

const emptyCode = () => Array(KEY_LENGTH).fill("");

interface DeveloperKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DeveloperKeyModal({ open, onClose }: DeveloperKeyModalProps) {
  const [code, setCode] = useState<string[]>(emptyCode());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      setCode(emptyCode());
      setError("");
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < KEY_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index]) {
        e.preventDefault();
        handleChange(index, "");
        return;
      }
      if (index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
        handleChange(index - 1, "");
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < KEY_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, KEY_LENGTH);
    if (!pastedData) return;

    const newCode = emptyCode();
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    setError("");

    const nextEmptyIndex = newCode.findIndex((c) => !c);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[KEY_LENGTH - 1]?.focus();
    }
  };

  const handleInputChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      handleChange(index, "");
      return;
    }
    handleChange(index, digitsOnly.slice(-1));
  };

  const handleContinue = () => {
    const enteredCode = code.join("");

    if (enteredCode.length !== KEY_LENGTH) {
      setError(`Please enter all ${KEY_LENGTH} digits`);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (enteredCode === DEVELOPER_KEY) {
        localStorage.setItem("developerAuth", "true");
        localStorage.setItem("developerAuthTime", Date.now().toString());
        onClose();
        navigate("/developer");
      } else {
        setError("Invalid developer key. Please try again.");
        setCode(emptyCode());
        inputRefs.current[0]?.focus();
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-xl p-4 sm:p-6 bg-white border-gray-200">
        <DialogHeader className="text-center">
          <DialogTitle className="theme-heading text-center">Sp Console</DialogTitle>
          <DialogDescription className="text-gray-600 text-center">
            Get in your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Developer Key</label>

            <div className="flex flex-nowrap justify-center gap-1 sm:gap-2.5" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={1}
                  value={digit ? MASK_CHAR : ""}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`size-[clamp(1.5rem,8vw,2.75rem)] flex-shrink-0 text-center text-base sm:text-xl font-bold border-2 rounded-md sm:rounded-lg text-black focus:outline-none transition-colors ${
                    error ? "border-red-400 bg-red-50" : "bg-white"
                  }`}
                  style={{
                    borderColor: error ? undefined : "var(--theme-primary)",
                  }}
                  onFocus={(e) => {
                    if (!error) {
                      e.target.style.borderColor = "var(--theme-primary)";
                      e.target.style.boxShadow = "0 0 0 2px var(--theme-primary)";
                    }
                  }}
                  onBlur={(e) => {
                    if (!error) {
                      e.target.style.borderColor = "var(--theme-primary)";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                  aria-label={`Developer key digit ${index + 1}`}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
          </div>

          <button
            onClick={handleContinue}
            disabled={isLoading}
            className="theme-button w-full h-12 rounded-lg font-medium flex items-center justify-center gap-2"
            style={{
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
