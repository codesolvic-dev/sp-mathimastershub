import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { getCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import {
  dismissWelcomePopup,
  isWelcomePopupDismissed,
  normalizeWelcomePopup,
  resolveWelcomePopupImageUrl,
  type WelcomePopupSettings,
} from "@/utils/welcomePopup";

function isStorefrontPath(pathname: string) {
  return (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/developer") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/access") &&
    !pathname.startsWith("/forgot") &&
    !pathname.startsWith("/reset-password")
  );
}

export default function WelcomePopup() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<WelcomePopupSettings | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const companyName = useMemo(() => {
    const cached = getCachedData<{ company?: string }>(CACHE_KEYS.COMPANY);
    return cached?.company?.trim() || "";
  }, []);

  useEffect(() => {
    if (!isStorefrontPath(pathname)) {
      setOpen(false);
      return;
    }
    if (isWelcomePopupDismissed()) return;

    let cancelled = false;

    getCompany()
      .then((company) => {
        if (cancelled) return;

        if (company?.maintenanceMode?.enabled === true) {
          setOpen(false);
          return;
        }

        const popup = normalizeWelcomePopup(company?.welcomePopup, company?.company || companyName);
        setSettings(popup);
        setImageUrl(resolveWelcomePopupImageUrl(company?.welcomePopup?.imageUrl));

        if (popup.enabled === true) {
          setOpen(true);
        } else {
          setOpen(false);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pathname, companyName]);

  const handleClose = () => {
    dismissWelcomePopup();
    setOpen(false);
  };

  if (!open || !settings) return null;

  const hasImage = Boolean(imageUrl);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close welcome popup overlay"
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-popup-title"
        className={`relative z-[10001] w-full bg-white rounded-2xl shadow-2xl overflow-hidden ${
          hasImage ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white"
        >
          <X size={16} />
        </button>

        <div className={`flex ${hasImage ? "flex-col sm:flex-row" : "flex-col"}`}>
          {hasImage ? (
            <div className="sm:w-[42%] shrink-0 bg-gray-50">
              <img
                src={imageUrl}
                alt=""
                className="w-full h-48 sm:h-full sm:min-h-[260px] object-cover"
              />
            </div>
          ) : null}

          <div className={`flex flex-col justify-center p-6 sm:p-8 ${hasImage ? "sm:flex-1" : ""}`}>
            <h2 id="welcome-popup-title" className="text-2xl sm:text-3xl font-bold text-gray-900 pr-8">
              {settings.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              {settings.description}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full py-3 rounded-lg theme-button text-sm font-semibold transition-colors"
            >
              {settings.buttonLabel || "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
