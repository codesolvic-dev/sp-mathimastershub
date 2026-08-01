import React, { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Send, Facebook, Instagram, Linkedin } from "lucide-react";
import type { MaintenanceModeSettings } from "@/utils/maintenanceMode";
import {
  getCountdownParts,
  pad2,
  resolveMaintenanceImageUrl,
} from "@/utils/maintenanceMode";

type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
};

type Props = {
  settings: MaintenanceModeSettings;
  companyName?: string;
  logoUrl?: string;
  socialLinks?: SocialLinks;
  preview?: boolean;
  previewWidth?: "desktop" | "tablet" | "mobile";
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.53-8.668L1.5 2.25h6.908l4.263 5.697L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export default function MaintenancePage({
  settings,
  companyName = "",
  logoUrl = "",
  socialLinks,
  preview = false,
  previewWidth = "desktop",
}: Props) {
  const imageUrl = resolveMaintenanceImageUrl(settings.backgroundImage);
  const useImage = settings.backgroundMode === "image" && !!imageUrl;
  const useGradient = settings.backgroundMode === "gradient";
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!settings.showCountdown || !settings.countdownEndsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [settings.showCountdown, settings.countdownEndsAt]);

  const countdown = useMemo(
    () => getCountdownParts(settings.countdownEndsAt, now),
    [settings.countdownEndsAt, now]
  );

  const backgroundStyle: React.CSSProperties = useImage
    ? {
        backgroundColor: settings.backgroundColor,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : useGradient
      ? {
          backgroundImage: `linear-gradient(145deg, ${settings.backgroundColor}, ${settings.backgroundColorSecondary})`,
        }
      : {
          backgroundColor: settings.backgroundColor,
        };

  const showOverlay = (useImage || useGradient) && settings.overlayOpacity > 0.01;

  const socialItems = [
    {
      key: "facebook",
      enabled: settings.socialFacebook,
      href: socialLinks?.facebook,
      icon: Facebook,
      label: "Facebook",
    },
    {
      key: "instagram",
      enabled: settings.socialInstagram,
      href: socialLinks?.instagram,
      icon: Instagram,
      label: "Instagram",
    },
    {
      key: "twitter",
      enabled: settings.socialTwitter,
      href: socialLinks?.twitter,
      icon: XIcon,
      label: "Twitter",
    },
    {
      key: "linkedin",
      enabled: settings.socialLinkedin,
      href: socialLinks?.linkedin,
      icon: Linkedin,
      label: "LinkedIn",
    },
  ].filter((s) => s.enabled && s.href);

  const titleSize = preview
    ? Math.max(22, Math.round(settings.titleFontSize * (previewWidth === "mobile" ? 0.45 : previewWidth === "tablet" ? 0.65 : 0.78)))
    : settings.titleFontSize;
  const messageSize = preview
    ? Math.max(12, Math.round(settings.messageFontSize * (previewWidth === "mobile" ? 0.7 : 0.85)))
    : settings.messageFontSize;

  const content = (
    <>
        {settings.customCss ? <style>{settings.customCss}</style> : null}

      {useImage && settings.backgroundBlur > 0 ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            ...backgroundStyle,
            filter: `blur(${settings.backgroundBlur}px)`,
            transform: "scale(1.08)",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={backgroundStyle} />
      )}

      {showOverlay ? (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundColor: settings.overlayColor,
            opacity: settings.overlayOpacity,
          }}
        />
      ) : null}

      <div
        className={`relative z-10 mx-auto flex w-full flex-col items-center text-center ${
          preview ? "px-5 py-10" : "px-6 py-16 sm:px-10"
        }`}
        style={{ color: settings.textColor, maxWidth: previewWidth === "mobile" ? 360 : 720 }}
      >
        {settings.showLogo && logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName || "Logo"}
            className="mb-6 object-contain"
            style={{
              maxWidth: preview
                ? Math.min(settings.logoMaxWidth, previewWidth === "mobile" ? 140 : 200)
                : settings.logoMaxWidth,
              maxHeight: preview ? 64 : 88,
            }}
          />
        ) : settings.showLogo && companyName ? (
          <p
            className="mb-6 font-semibold tracking-wide"
            style={{ color: settings.accentColor, fontSize: preview ? 18 : 24 }}
          >
            {companyName}
          </p>
        ) : null}

        <h1
          className="font-bold leading-tight tracking-tight"
          style={{ color: settings.titleColor, fontSize: titleSize }}
        >
          {settings.title || "We'll Be Back Soon!"}
        </h1>

        <p
          className="mt-4 max-w-xl leading-relaxed"
          style={{ color: settings.messageColor, fontSize: messageSize }}
        >
          {settings.message}
        </p>

        {settings.showCountdown && settings.countdownEndsAt ? (
          <div
            className={`mt-8 grid grid-cols-4 gap-2 sm:gap-3 ${preview ? "mt-6" : ""}`}
            style={{ color: settings.titleColor }}
          >
            {[
              { label: "Days", value: pad2(countdown.days) },
              { label: "Hours", value: pad2(countdown.hours) },
              { label: "Minutes", value: pad2(countdown.minutes) },
              { label: "Seconds", value: pad2(countdown.seconds) },
            ].map((unit) => (
              <div
                key={unit.label}
                className="rounded-xl border px-2 py-3 sm:px-3"
                style={{
                  borderColor: `${settings.titleColor}33`,
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              >
                <div className={`font-bold tabular-nums ${preview ? "text-lg" : "text-2xl sm:text-3xl"}`}>
                  {unit.value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider opacity-80 sm:text-xs">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {settings.showContact && (settings.contactEmail || settings.contactPhone) ? (
          <div
            className={`mt-7 flex flex-wrap items-center justify-center gap-4 text-sm ${preview ? "mt-5 text-xs" : ""}`}
            style={{ color: settings.messageColor }}
          >
            {settings.contactEmail ? (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="inline-flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <Mail className="h-4 w-4" />
                {settings.contactEmail}
              </a>
            ) : null}
            {settings.contactPhone ? (
              <a
                href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <Phone className="h-4 w-4" />
                {settings.contactPhone}
              </a>
            ) : null}
          </div>
        ) : null}

        {settings.showSocial && socialItems.length > 0 ? (
          <div className={`mt-6 flex items-center justify-center gap-3 ${preview ? "mt-5" : ""}`}>
            {socialItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border transition-opacity hover:opacity-90"
                  style={{
                    borderColor: `${settings.titleColor}44`,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: settings.titleColor,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        ) : null}

        {settings.showButton && settings.buttonLabel ? (
          <a
            href={settings.buttonLink || "#"}
            className={`mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90 ${
              preview ? "mt-6" : ""
            }`}
            style={{
              backgroundColor: settings.buttonColor,
              color: settings.buttonTextColor,
            }}
            target={settings.buttonLink?.startsWith("http") ? "_blank" : undefined}
            rel={settings.buttonLink?.startsWith("http") ? "noopener noreferrer" : undefined}
            onClick={(e) => {
              if (!settings.buttonLink || settings.buttonLink === "#") e.preventDefault();
            }}
          >
            <Send className="h-4 w-4" />
            {settings.buttonLabel}
          </a>
        ) : null}

        {settings.footerText ? (
          <p
            className={`mt-10 max-w-md ${preview ? "mt-8" : ""}`}
            style={{
              color: settings.footerTextColor,
              fontSize: preview
                ? Math.max(10, settings.footerFontSize - 2)
                : settings.footerFontSize,
            }}
          >
            {settings.footerText}
          </p>
        ) : null}
      </div>
    </>
  );

  if (preview) {
    const widthClass =
      previewWidth === "mobile"
        ? "max-w-[375px]"
        : previewWidth === "tablet"
          ? "max-w-[768px]"
          : "w-full";
    return (
      <div className={`mx-auto ${widthClass} transition-all duration-300`}>
        <div className="relative min-h-[520px] overflow-hidden rounded-xl border border-gray-200 shadow-inner">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {content}
    </div>
  );
}
