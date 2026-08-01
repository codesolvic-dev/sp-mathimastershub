import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getCompany } from "@/api/company.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import {
  dismissAnnouncementBar,
  isAnnouncementDismissed,
  isInternalAnnouncementLink,
  normalizeAnnouncementBar,
  setAnnouncementBarHeight,
  type AnnouncementBarSettings,
} from "@/utils/announcementBar";

export default function AnnouncementBar() {
  const [settings, setSettings] = useState<AnnouncementBarSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applySettings = (raw: unknown) => {
      const normalized = normalizeAnnouncementBar(
        (raw as { announcementBar?: AnnouncementBarSettings } | null)?.announcementBar
      );
      setSettings(normalized);
      setDismissed(isAnnouncementDismissed(normalized));
      setActiveIndex(0);
    };

    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) applySettings(cached);

    getCompany()
      .then((data) => {
        setCompanyCache(data);
        applySettings(data);
      })
      .catch(() => {
        if (!cached) applySettings(null);
      });
  }, []);

  const messages = useMemo(
    () => (settings?.messages || []).filter((message) => message.text?.trim()),
    [settings]
  );

  const visible = Boolean(settings?.enabled && messages.length > 0 && !dismissed);
  const isDisplayed = visible && !hiddenByScroll;
  const currentMessage = messages[activeIndex] || messages[0];
  const showArrows = messages.length > 1;

  useEffect(() => {
    if (!visible || !settings?.autoRotate || messages.length <= 1) return;

    const intervalMs = Math.max(3, settings.rotateIntervalSeconds || 5) * 1000;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [visible, settings?.autoRotate, settings?.rotateIntervalSeconds, messages.length]);

  useEffect(() => {
    if (!visible) {
      setHiddenByScroll(false);
      return;
    }

    const onScroll = () => {
      setHiddenByScroll(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  useEffect(() => {
    const updateHeight = () => {
      if (!isDisplayed || !barRef.current) {
        setAnnouncementBarHeight(0);
        return;
      }
      setAnnouncementBarHeight(barRef.current.offsetHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      setAnnouncementBarHeight(0);
    };
  }, [isDisplayed, activeIndex, settings, currentMessage?.text, showArrows]);

  if (!visible || !settings || !currentMessage) {
    return null;
  }

  const backgroundColor = settings.backgroundColor?.trim() || "#000000";
  const textColor = settings.textColor?.trim() || "#ffffff";

  const handleDismiss = () => {
    dismissAnnouncementBar(settings);
    setDismissed(true);
    setAnnouncementBarHeight(0);
  };

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + messages.length) % messages.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % messages.length);

  const renderMessage = () => {
    const text = currentMessage.text;
    const link = currentMessage.link?.trim();
    const messageClass =
      "block w-full truncate text-sm font-normal tracking-[0.01em] leading-tight transition-opacity duration-300";

    if (!link) {
      return <span className={messageClass}>{text}</span>;
    }

    if (isInternalAnnouncementLink(link)) {
      return (
        <Link to={link} className={`${messageClass} hover:opacity-80`}>
          {text}
        </Link>
      );
    }

    return (
      <a
        href={link}
        className={`${messageClass} hover:opacity-80`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  };

  const arrowButtonClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded opacity-90 hover:opacity-100";

  return (
    <div
      ref={barRef}
      className={`fixed top-0 left-0 right-0 z-[55] w-full transition-transform duration-300 ease-in-out ${
        hiddenByScroll ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ backgroundColor, color: textColor }}
      role="region"
      aria-label="Store announcement"
    >
      <div
        className={`relative mx-auto grid h-11 w-full max-w-7xl items-center px-10 sm:px-12 ${
          showArrows ? "grid-cols-[2rem_minmax(0,1fr)_2rem]" : "grid-cols-1"
        }`}
      >
        {showArrows ? (
          <button
            type="button"
            onClick={goPrev}
            className={`${arrowButtonClass} justify-self-start`}
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}

        <div
          className="min-w-0 text-center px-2 truncate whitespace-nowrap"
          title={currentMessage.text}
        >
          {renderMessage()}
        </div>

        {showArrows ? (
          <button
            type="button"
            onClick={goNext}
            className={`${arrowButtonClass} justify-self-end`}
            aria-label="Next announcement"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}

        {settings.dismissible !== false ? (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded opacity-70 hover:opacity-100 sm:right-3"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
