import React, { useEffect, useRef, useState } from "react";
import {
  Wrench,
  Save,
  Image as ImageIcon,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  PartyPopper,
  Database,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCompany, updateCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { setCompanyCache } from "@/utils/companyCache";
import HexColorPickerField from "@/components/ui/HexColorPickerField";
import MaintenancePage from "@/components/maintenance/MaintenancePage";
import AnnouncementBarSettingsForm from "@/components/control-panel/AnnouncementBarSettingsForm";
import WelcomePopupSettingsForm from "@/components/control-panel/WelcomePopupSettingsForm";
import DatabaseImportExportPanel from "@/components/control-panel/DatabaseImportExportPanel";
import {
  DEFAULT_MAINTENANCE_MODE,
  normalizeMaintenanceMode,
  type MaintenanceBackgroundMode,
  type MaintenanceModeSettings,
} from "@/utils/maintenanceMode";
import {
  DEFAULT_ANNOUNCEMENT_BAR,
  type AnnouncementBarSettings,
} from "@/utils/announcementBar";
import {
  DEFAULT_WELCOME_POPUP,
  resolveWelcomePopupImageUrl,
  type WelcomePopupSettings,
} from "@/utils/welcomePopup";
import {
  APP_RELEASE_DATE,
  APP_VERSION_LABEL,
  CURRENT_CHANGELOG,
} from "@/constants/appVersion";

type TabId = "customization" | "access" | "seo" | "advanced";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type PanelView = "home" | "maintenance" | "announcement" | "welcome" | "database";

type CompanyMeta = {
  company?: string;
  logo?: string;
  email?: string;
  phone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
    skype?: string;
    pinterest?: string;
    snapchat?: string;
    other?: string;
  };
};

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle"}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "" : "bg-gray-300"
      }`}
      style={checked ? { backgroundColor: "var(--theme-primary)" } : {}}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-2">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25 focus:border-[var(--theme-primary)] ${props.className || ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25 focus:border-[var(--theme-primary)] resize-y ${props.className || ""}`}
    />
  );
}

function MiniColor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-300 shadow-sm"
      style={{ backgroundColor: value || "#ffffff" }}
      title={value}
    >
      <input
        type="color"
        value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#ffffff"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

const TITLE_SIZES = [28, 32, 36, 40, 48, 56, 64];
const BODY_SIZES = [14, 16, 18, 20, 22, 24];
const FOOTER_SIZES = [12, 13, 14, 15, 16];

export default function ControlPanelPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("home");
  const [tab, setTab] = useState<TabId>("customization");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [companyMeta, setCompanyMeta] = useState<CompanyMeta>({});
  const [settings, setSettings] = useState<MaintenanceModeSettings>({
    ...DEFAULT_MAINTENANCE_MODE,
  });
  const [announcement, setAnnouncement] = useState<AnnouncementBarSettings>({
    ...DEFAULT_ANNOUNCEMENT_BAR,
    messages: [...(DEFAULT_ANNOUNCEMENT_BAR.messages || [])],
  });
  const [welcome, setWelcome] = useState<WelcomePopupSettings>({
    ...DEFAULT_WELCOME_POPUP,
  });
  const [metaPixel, setMetaPixel] = useState({ enabled: false, pixelId: "" });
  const [pixelToggling, setPixelToggling] = useState(false);
  const [bgFileName, setBgFileName] = useState("");
  const [clearBgImage, setClearBgImage] = useState(false);
  const [clearWelcomeImage, setClearWelcomeImage] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const welcomeImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = getCachedData<
          CompanyMeta & {
            maintenanceMode?: Partial<MaintenanceModeSettings>;
            announcementBar?: AnnouncementBarSettings;
            welcomePopup?: WelcomePopupSettings;
            metaPixel?: { enabled?: boolean; pixelId?: string };
          }
        >(CACHE_KEYS.COMPANY);
        if (cached && !cancelled) {
          setCompanyMeta(cached);
          setSettings(normalizeMaintenanceMode(cached.maintenanceMode));
          setAnnouncement({
            ...DEFAULT_ANNOUNCEMENT_BAR,
            ...(cached.announcementBar || {}),
            messages:
              cached.announcementBar?.messages?.length
                ? cached.announcementBar.messages
                : [...(DEFAULT_ANNOUNCEMENT_BAR.messages || [])],
            enabled: cached.announcementBar?.enabled === true,
          });
          setWelcome({
            ...DEFAULT_WELCOME_POPUP,
            ...(cached.welcomePopup || {}),
            enabled: cached.welcomePopup?.enabled === true,
            imageUrl: resolveWelcomePopupImageUrl(cached.welcomePopup?.imageUrl),
          });
          setMetaPixel({
            enabled: Boolean(cached.metaPixel?.enabled),
            pixelId: String(cached.metaPixel?.pixelId || "").replace(/\D/g, ""),
          });
        }
        const data = await getCompany();
        if (cancelled || !data) return;
        setCompanyMeta(data);
        const next = normalizeMaintenanceMode(data.maintenanceMode);
        if (!next.contactEmail && data.email) next.contactEmail = data.email;
        if (!next.contactPhone && data.phone) next.contactPhone = data.phone;
        if (!next.countdownEndsAt) {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          d.setHours(12, 0, 0, 0);
          next.countdownEndsAt = d.toISOString();
        }
        setSettings(next);
        setAnnouncement({
          ...DEFAULT_ANNOUNCEMENT_BAR,
          ...(data.announcementBar || {}),
          messages:
            data.announcementBar?.messages?.length
              ? data.announcementBar.messages
              : [...(DEFAULT_ANNOUNCEMENT_BAR.messages || [])],
          enabled: data.announcementBar?.enabled === true,
        });
        setWelcome({
          ...DEFAULT_WELCOME_POPUP,
          ...(data.welcomePopup || {}),
          enabled: data.welcomePopup?.enabled === true,
          imageUrl: resolveWelcomePopupImageUrl(data.welcomePopup?.imageUrl),
        });
        setMetaPixel({
          enabled: Boolean(data.metaPixel?.enabled),
          pixelId: String(data.metaPixel?.pixelId || "").replace(/\D/g, ""),
        });
        setCompanyCache(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = <K extends keyof MaintenanceModeSettings>(
    key: K,
    value: MaintenanceModeSettings[K]
  ) => setSettings((prev) => ({ ...prev, [key]: value }));

  const onBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFileName(file.name);
    setClearBgImage(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSettings((prev) => ({
        ...prev,
        backgroundImage: event.target?.result as string,
        backgroundMode: "image",
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearBackgroundImage = () => {
    setBgFileName("");
    setClearBgImage(true);
    if (bgInputRef.current) bgInputRef.current.value = "";
    setSettings((prev) => ({
      ...prev,
      backgroundImage: "",
      backgroundMode: prev.backgroundMode === "image" ? "color" : prev.backgroundMode,
    }));
  };

  const handleSave = async (forceEnabled?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const file = bgInputRef.current?.files?.[0];
      const existingImageUrl =
        settings.backgroundImage && !settings.backgroundImage.startsWith("data:")
          ? settings.backgroundImage
          : "";
      const nextSettings = normalizeMaintenanceMode({
        ...settings,
        enabled: forceEnabled === undefined ? settings.enabled : forceEnabled,
        backgroundImage: clearBgImage ? "" : existingImageUrl,
      });

      const updated = await updateCompany({
        maintenanceMode: nextSettings,
        maintenanceBackgroundImageFile: file,
        clearMaintenanceBackgroundImage: clearBgImage && !file,
      });
      const normalized = normalizeMaintenanceMode(updated?.maintenanceMode);
      setSettings(normalized);
      setCompanyMeta(updated || companyMeta);
      setCompanyCache(updated);
      setClearBgImage(false);
      setBgFileName("");
      if (bgInputRef.current) bgInputRef.current.value = "";
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 2200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnnouncement = async (forceEnabled?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const enabled = forceEnabled === undefined ? announcement.enabled === true : forceEnabled;
      const payload = {
        ...announcement,
        enabled,
        messages: (announcement.messages || [])
          .map((message, index) => ({
            text: String(message?.text || "").trim(),
            link: String(message?.link || "").trim(),
            order: index,
          }))
          .filter((message) => message.text),
      };
      const updated = await updateCompany({ announcementBar: payload });
      const next = {
        ...DEFAULT_ANNOUNCEMENT_BAR,
        ...(updated?.announcementBar || payload),
        messages:
          updated?.announcementBar?.messages?.length > 0
            ? updated.announcementBar.messages
            : payload.messages.length > 0
              ? payload.messages
              : [...(DEFAULT_ANNOUNCEMENT_BAR.messages || [])],
        enabled: updated?.announcementBar?.enabled === true || payload.enabled,
      };
      setAnnouncement(next);
      setCompanyMeta(updated || companyMeta);
      setCompanyCache(updated);
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 2200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save announcement bar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWelcome = async (forceEnabled?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const enabled = forceEnabled === undefined ? welcome.enabled === true : forceEnabled;
      const file = welcomeImageInputRef.current?.files?.[0];
      const existingImageUrl =
        welcome.imageUrl && !String(welcome.imageUrl).startsWith("data:")
          ? String(welcome.imageUrl).trim()
          : "";
      const payload: WelcomePopupSettings = {
        enabled,
        title: String(welcome.title || "").trim(),
        description: String(welcome.description || "").trim(),
        buttonLabel: String(welcome.buttonLabel || "Continue").trim() || "Continue",
        imageUrl: clearWelcomeImage ? "" : existingImageUrl,
      };
      const updated = await updateCompany({
        welcomePopup: payload,
        welcomePopupImageFile: file,
        clearWelcomePopupImage: clearWelcomeImage && !file,
      });
      const next = {
        ...DEFAULT_WELCOME_POPUP,
        ...(updated?.welcomePopup || payload),
        enabled: updated?.welcomePopup?.enabled === true || payload.enabled,
        imageUrl: resolveWelcomePopupImageUrl(updated?.welcomePopup?.imageUrl),
      };
      setWelcome(next);
      setCompanyMeta(updated || companyMeta);
      setCompanyCache(updated);
      setClearWelcomeImage(false);
      if (welcomeImageInputRef.current) welcomeImageInputRef.current.value = "";
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 2200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save welcome popup");
    } finally {
      setSaving(false);
    }
  };

  const handleMetaPixelToggle = async (nextEnabled: boolean) => {
    if (nextEnabled && !String(metaPixel.pixelId || "").trim()) {
      setError("Add a Meta Pixel ID first (Developer → Third-Party Services → Meta Pixel)");
      navigate("/developer/third-party-services/meta-pixel");
      return;
    }
    const prev = metaPixel;
    setMetaPixel((p) => ({ ...p, enabled: nextEnabled }));
    setPixelToggling(true);
    setError(null);
    try {
      const updated = await updateCompany({
        metaPixel: {
          enabled: nextEnabled,
          pixelId: String(metaPixel.pixelId || "").trim(),
        },
      });
      const next = {
        enabled: Boolean(updated?.metaPixel?.enabled ?? nextEnabled),
        pixelId: String(updated?.metaPixel?.pixelId ?? metaPixel.pixelId ?? "").replace(/\D/g, ""),
      };
      setMetaPixel(next);
      if (updated) setCompanyCache(updated);
      setSavedFeedback(true);
      window.setTimeout(() => setSavedFeedback(false), 2200);
    } catch (e: any) {
      setMetaPixel(prev);
      setError(e?.response?.data?.message || e?.message || "Failed to update Meta Pixel");
    } finally {
      setPixelToggling(false);
    }
  };

  const resetDefaults = () => {
    const keepEnabled = settings.enabled;
    const keepImage = settings.backgroundImage.startsWith("data:")
      ? ""
      : settings.backgroundImage;
    setSettings({
      ...DEFAULT_MAINTENANCE_MODE,
      enabled: keepEnabled,
      backgroundImage: keepImage,
      contactEmail: companyMeta.email || "",
      contactPhone: companyMeta.phone || "",
      countdownEndsAt: settings.countdownEndsAt || DEFAULT_MAINTENANCE_MODE.countdownEndsAt,
    });
  };

  const openFullPreview = () => {
    try {
      sessionStorage.setItem("force-maintenance-preview", "1");
    } catch {
      // ignore
    }
    window.open("/", "_blank", "noopener,noreferrer");
  };

  const countdownDate = settings.countdownEndsAt
    ? new Date(settings.countdownEndsAt)
    : null;
  const dateValue =
    countdownDate && !Number.isNaN(countdownDate.getTime())
      ? countdownDate.toISOString().slice(0, 10)
      : "";
  const timeValue =
    countdownDate && !Number.isNaN(countdownDate.getTime())
      ? countdownDate.toTimeString().slice(0, 5)
      : "12:00";

  const setCountdownParts = (date: string, time: string) => {
    if (!date) {
      patch("countdownEndsAt", "");
      return;
    }
    const iso = new Date(`${date}T${time || "12:00"}:00`).toISOString();
    patch("countdownEndsAt", iso);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "customization", label: "Customization" },
    { id: "access", label: "Access Settings" },
    { id: "seo", label: "SEO Settings" },
    { id: "advanced", label: "Advanced" },
  ];

  const modeOptions: { id: MaintenanceBackgroundMode; label: string }[] = [
    { id: "color", label: "Solid Color" },
    { id: "gradient", label: "Gradient" },
    { id: "image", label: "Background Image" },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-10 w-80 rounded bg-gray-200 animate-pulse mb-4" />
        <div className="h-[480px] rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (panelView === "home") {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold theme-heading">Control Panel</h1>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {APP_VERSION_LABEL}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Site-wide controls and tools. Open a card below to manage settings.
          </p>
        </div>

        {/* Version + changelog */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Release notes</h2>
                <span className="text-xs text-gray-500">{APP_RELEASE_DATE}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{CURRENT_CHANGELOG.title}</p>
              <p className="mt-1 text-xs text-gray-400">
                Full notes: <code className="text-gray-500">doc/CHANGELOG_1.0.3.md</code>
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {CURRENT_CHANGELOG.sections.map((section) => (
              <div
                key={section.title}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{section.title}</h3>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="text-xs text-gray-600 leading-relaxed flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance card — click to open details */}
        <button
          type="button"
          onClick={() => setPanelView("maintenance")}
          className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[var(--theme-primary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Wrench className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Turn Website Maintenance Mode On/Off
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      settings.enabled
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        settings.enabled ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    {settings.enabled ? "Under Maintenance" : "Site Live"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                  Enable maintenance mode to temporarily restrict public access to your website
                  while you make updates or improvements. Click to customize background, text,
                  countdown, and more.
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-gray-400" />
          </div>
        </button>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPanelView("announcement")}
            className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--theme-primary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Announcement Bar</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      announcement.enabled
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        announcement.enabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {announcement.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Top bar promotions above the header. Disabled bars are hidden on the storefront.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 mt-1" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPanelView("welcome")}
            className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--theme-primary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <PartyPopper className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Welcome Popup</h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      welcome.enabled
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        welcome.enabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {welcome.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  One-time greeting popup for visitors. Disabled popups never show on the storefront.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 mt-1" />
            </div>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/developer/third-party-services/meta-pixel")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
                style={{ backgroundColor: "var(--theme-primary)" }}
                aria-label="Open Meta Pixel settings"
              >
                <Activity className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/developer/third-party-services/meta-pixel")}
                    className="text-lg font-bold text-gray-900 hover:underline text-left"
                  >
                    Meta Pixel
                  </button>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      metaPixel.enabled
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        metaPixel.enabled ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {metaPixel.enabled ? "On" : "Off"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Storefront Facebook tracking. Toggle here; set Pixel ID in Third-Party Services.
                  {metaPixel.pixelId ? (
                    <>
                      {" "}
                      ID: <span className="font-mono text-gray-700">{metaPixel.pixelId}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <Toggle
                checked={metaPixel.enabled}
                disabled={pixelToggling}
                onChange={(v) => void handleMetaPixelToggle(v)}
                label="Meta Pixel"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPanelView("database")}
          className="mt-4 w-full text-left rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-[var(--theme-primary)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Database className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Database</h2>
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                  Import and export the full MongoDB database as JSON. Use this to backup or migrate
                  products, orders, sections, and settings.
                </p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-gray-400" />
          </div>
        </button>
      </div>
    );
  }

  if (panelView === "database") {
    return (
      <div className="p-4 sm:p-6 pb-10">
        <button
          type="button"
          onClick={() => setPanelView("home")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Control Panel
        </button>
        <DatabaseImportExportPanel />
      </div>
    );
  }

  if (panelView === "announcement") {
    return (
      <div className="p-4 sm:p-6 pb-28">
        <button
          type="button"
          onClick={() => setPanelView("home")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Control Panel
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Announcement Bar</h1>
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                  Configure messages and colors. When disabled, the bar is not shown on the storefront.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">Enable Announcement Bar</span>
              <Toggle
                checked={announcement.enabled === true}
                onChange={(v) => setAnnouncement((prev) => ({ ...prev, enabled: v }))}
                label="Enable Announcement Bar"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <AnnouncementBarSettingsForm value={announcement} onChange={setAnnouncement} />
        </div>

        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-end gap-3">
            {announcement.enabled ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAnnouncement(false)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Disable Bar
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveAnnouncement(true)}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Enable Announcement Bar
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveAnnouncement()}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : savedFeedback ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (panelView === "welcome") {
    return (
      <div className="p-4 sm:p-6 pb-28">
        <button
          type="button"
          onClick={() => setPanelView("home")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Control Panel
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <PartyPopper className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Popup</h1>
                <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                  Customize the greeting popup. When disabled, it never appears for customers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">Enable Welcome Popup</span>
              <Toggle
                checked={welcome.enabled === true}
                onChange={(v) => setWelcome((prev) => ({ ...prev, enabled: v }))}
                label="Enable Welcome Popup"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
          <WelcomePopupSettingsForm
            value={welcome}
            companyName={companyMeta.company}
            onChange={setWelcome}
            imageInputRef={welcomeImageInputRef}
            onClearImageFlag={setClearWelcomeImage}
          />
        </div>

        <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-30 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-end gap-3">
            {welcome.enabled ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveWelcome(false)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Disable Popup
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveWelcome(true)}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Enable Welcome Popup
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveWelcome()}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : savedFeedback ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-28">
      <button
        type="button"
        onClick={() => setPanelView("home")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Control Panel
      </button>

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Turn Website Maintenance Mode On/Off
                </h1>
                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {APP_VERSION_LABEL}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                Enable maintenance mode to temporarily restrict public access to your website
                while you make updates or improvements.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
              <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
              <Toggle
                checked={settings.enabled}
                onChange={(v) => patch("enabled", v)}
                label="Maintenance Mode"
              />
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                settings.enabled
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  settings.enabled ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
              {settings.enabled ? "Under Maintenance" : "Site Live"}
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] gap-6">
        {/* Left */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 px-4 sm:px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.id
                      ? "border-[var(--theme-primary)] text-[var(--theme-primary)] bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6 space-y-8">
              {tab === "customization" && (
                <>
                  {/* Background */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Background</h3>
                    <FieldLabel>Background Type</FieldLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                      {modeOptions.map((opt) => {
                        const active = settings.backgroundMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => patch("backgroundMode", opt.id)}
                            className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                              active
                                ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 text-gray-900"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {settings.backgroundMode === "color" && (
                      <HexColorPickerField
                        label="Background Color"
                        value={settings.backgroundColor}
                        onChange={(v) => patch("backgroundColor", v)}
                        fallback="#0f172a"
                      />
                    )}

                    {settings.backgroundMode === "gradient" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <HexColorPickerField
                          label="Color 1"
                          value={settings.backgroundColor}
                          onChange={(v) => patch("backgroundColor", v)}
                          fallback="#0f172a"
                        />
                        <HexColorPickerField
                          label="Color 2"
                          value={settings.backgroundColorSecondary}
                          onChange={(v) => patch("backgroundColorSecondary", v)}
                          fallback="#1e293b"
                        />
                      </div>
                    )}

                    {settings.backgroundMode === "image" && (
                      <div className="space-y-4">
                        <div>
                          <FieldLabel>Upload Image</FieldLabel>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              ref={bgInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={onBgFileChange}
                            />
                            <button
                              type="button"
                              onClick={() => bgInputRef.current?.click()}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <ImageIcon className="h-4 w-4" />
                              {settings.backgroundImage ? "Change Image" : "Choose Image"}
                            </button>
                            {settings.backgroundImage ? (
                              <button
                                type="button"
                                onClick={clearBackgroundImage}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            ) : null}
                          </div>
                          {bgFileName ? (
                            <p className="text-xs text-gray-500 mt-1.5">{bgFileName}</p>
                          ) : null}
                          {settings.backgroundImage ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 max-w-md">
                              <img
                                src={settings.backgroundImage}
                                alt="Background preview"
                                className="h-36 w-full object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {(settings.backgroundMode === "image" ||
                      settings.backgroundMode === "gradient") && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>
                            Background Overlay ({Math.round(settings.overlayOpacity * 100)}%)
                          </FieldLabel>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(settings.overlayOpacity * 100)}
                            onChange={(e) =>
                              patch("overlayOpacity", Number(e.target.value) / 100)
                            }
                            className="w-full accent-[var(--theme-primary)]"
                          />
                        </div>
                        <HexColorPickerField
                          label="Overlay Color"
                          value={settings.overlayColor}
                          onChange={(v) => patch("overlayColor", v)}
                          fallback="#0B1220"
                        />
                      </div>
                    )}

                    {settings.backgroundMode === "image" && (
                      <div className="mt-4">
                        <FieldLabel>Image Blur ({settings.backgroundBlur}px)</FieldLabel>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          value={settings.backgroundBlur}
                          onChange={(e) => patch("backgroundBlur", Number(e.target.value))}
                          className="w-full accent-[var(--theme-primary)]"
                        />
                      </div>
                    )}
                  </section>

                  {/* Title */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Title</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <TextInput
                        value={settings.title}
                        onChange={(e) => patch("title", e.target.value)}
                        placeholder="We'll Be Back Soon!"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <MiniColor
                          value={settings.titleColor}
                          onChange={(v) => patch("titleColor", v)}
                        />
                        <select
                          value={settings.titleFontSize}
                          onChange={(e) => patch("titleFontSize", Number(e.target.value))}
                          className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
                        >
                          {TITLE_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}px
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Subtitle */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Subtitle</h3>
                    <TextArea
                      rows={3}
                      value={settings.message}
                      onChange={(e) => patch("message", e.target.value)}
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <MiniColor
                        value={settings.messageColor}
                        onChange={(v) => patch("messageColor", v)}
                      />
                      <select
                        value={settings.messageFontSize}
                        onChange={(e) => patch("messageFontSize", Number(e.target.value))}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
                      >
                        {BODY_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}px
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  {/* Countdown */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Countdown Timer</h3>
                      <Toggle
                        checked={settings.showCountdown}
                        onChange={(v) => patch("showCountdown", v)}
                        label="Countdown Timer"
                      />
                    </div>
                    {settings.showCountdown ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>End Date</FieldLabel>
                          <TextInput
                            type="date"
                            value={dateValue}
                            onChange={(e) => setCountdownParts(e.target.value, timeValue)}
                          />
                        </div>
                        <div>
                          <FieldLabel>End Time</FieldLabel>
                          <TextInput
                            type="time"
                            value={timeValue}
                            onChange={(e) => setCountdownParts(dateValue, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* Contact */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        Contact Information
                      </h3>
                      <Toggle
                        checked={settings.showContact}
                        onChange={(v) => patch("showContact", v)}
                        label="Contact Information"
                      />
                    </div>
                    {settings.showContact ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Email Address</FieldLabel>
                          <TextInput
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => patch("contactEmail", e.target.value)}
                            placeholder="hello@example.com"
                          />
                        </div>
                        <div>
                          <FieldLabel>Phone Number</FieldLabel>
                          <TextInput
                            value={settings.contactPhone}
                            onChange={(e) => patch("contactPhone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* Logo */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Logo</h3>
                      <Toggle
                        checked={settings.showLogo}
                        onChange={(v) => patch("showLogo", v)}
                        label="Show Logo"
                      />
                    </div>
                    {settings.showLogo ? (
                      <div className="flex flex-wrap items-center gap-4">
                        {companyMeta.logo ? (
                          <div className="h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 p-2 flex items-center justify-center overflow-hidden">
                            <img
                              src={companyMeta.logo}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Uses company logo from Company settings.
                          </p>
                        )}
                        <div className="w-40">
                          <FieldLabel>Max Width (px)</FieldLabel>
                          <TextInput
                            type="number"
                            min={80}
                            max={480}
                            value={settings.logoMaxWidth}
                            onChange={(e) =>
                              patch("logoMaxWidth", Number(e.target.value) || 250)
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* Social */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">Social Media</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Links come from Company → Social Links
                        </p>
                      </div>
                      <Toggle
                        checked={settings.showSocial}
                        onChange={(v) => patch("showSocial", v)}
                        label="Social Media"
                      />
                    </div>
                    {settings.showSocial ? (
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            ["socialFacebook", "Facebook"],
                            ["socialInstagram", "Instagram"],
                            ["socialTwitter", "Twitter / X"],
                            ["socialLinkedin", "LinkedIn"],
                          ] as const
                        ).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                          >
                            <span className="text-sm text-gray-700">{label}</span>
                            <Toggle
                              checked={settings[key]}
                              onChange={(v) => patch(key, v)}
                              label={label}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {/* Button */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Button</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Show Button</span>
                        <Toggle
                          checked={settings.showButton}
                          onChange={(v) => patch("showButton", v)}
                          label="Show Button"
                        />
                      </div>
                    </div>
                    {settings.showButton ? (
                      <div className="space-y-4">
                        <div>
                          <FieldLabel>Button Text</FieldLabel>
                          <TextInput
                            value={settings.buttonLabel}
                            onChange={(e) => patch("buttonLabel", e.target.value)}
                            placeholder="Notify Me"
                          />
                        </div>
                        <div>
                          <FieldLabel>Button Link</FieldLabel>
                          <TextInput
                            value={settings.buttonLink}
                            onChange={(e) => patch("buttonLink", e.target.value)}
                            placeholder="mailto:hello@example.com"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <HexColorPickerField
                            label="Button Color"
                            value={settings.buttonColor}
                            onChange={(v) => patch("buttonColor", v)}
                            fallback="#3B82F6"
                          />
                          <HexColorPickerField
                            label="Text Color"
                            value={settings.buttonTextColor}
                            onChange={(v) => patch("buttonTextColor", v)}
                            fallback="#FFFFFF"
                          />
                        </div>
                      </div>
                    ) : null}
                  </section>

                  {/* Additional text */}
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Additional Text (Optional)
                    </h3>
                    <TextArea
                      rows={2}
                      value={settings.footerText}
                      onChange={(e) => patch("footerText", e.target.value)}
                      placeholder="© 2026 Your Website. All Rights Reserved."
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <MiniColor
                        value={settings.footerTextColor}
                        onChange={(v) => patch("footerTextColor", v)}
                      />
                      <select
                        value={settings.footerFontSize}
                        onChange={(e) => patch("footerFontSize", Number(e.target.value))}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
                      >
                        {FOOTER_SIZES.map((s) => (
                          <option key={s} value={s}>
                            {s}px
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>
                </>
              )}

              {tab === "access" && (
                <div className="space-y-5">
                  <p className="text-sm text-gray-600">
                    Choose which areas stay reachable while maintenance mode is on.
                  </p>
                  {(
                    [
                      ["allowDeveloperAccess", "Allow Developer Panel", "/developer"],
                      ["allowAdminAccess", "Allow Admin Panel", "/admin"],
                      ["allowAuthPages", "Allow Login & Auth pages", "/login, /access, /forgot"],
                    ] as const
                  ).map(([key, label, hint]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
                      </div>
                      <Toggle
                        checked={settings[key]}
                        onChange={(v) => patch(key, v)}
                        label={label}
                      />
                    </div>
                  ))}
                  <div>
                    <FieldLabel>Extra exempt paths (comma or new line)</FieldLabel>
                    <TextArea
                      rows={3}
                      value={settings.customExemptPaths}
                      onChange={(e) => patch("customExemptPaths", e.target.value)}
                      placeholder="/status&#10;/health"
                    />
                  </div>
                </div>
              )}

              {tab === "seo" && (
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Page Title</FieldLabel>
                    <TextInput
                      value={settings.seoTitle}
                      onChange={(e) => patch("seoTitle", e.target.value)}
                      placeholder="Under Maintenance"
                    />
                  </div>
                  <div>
                    <FieldLabel>Meta Description</FieldLabel>
                    <TextArea
                      rows={3}
                      value={settings.seoDescription}
                      onChange={(e) => patch("seoDescription", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">noindex / nofollow</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Hide maintenance page from search engines
                      </p>
                    </div>
                    <Toggle
                      checked={settings.seoNoIndex}
                      onChange={(v) => patch("seoNoIndex", v)}
                      label="SEO noindex"
                    />
                  </div>
                </div>
              )}

              {tab === "advanced" && (
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Redirect URL (optional)</FieldLabel>
                    <TextInput
                      value={settings.redirectUrl}
                      onChange={(e) => patch("redirectUrl", e.target.value)}
                      placeholder="https://status.example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If set, public visitors are redirected instead of seeing the page.
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Custom CSS</FieldLabel>
                    <TextArea
                      rows={8}
                      value={settings.customCss}
                      onChange={(e) => patch("customCss", e.target.value)}
                      placeholder={".maintenance-title { letter-spacing: 0.02em; }"}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-4 h-fit">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Eye className="h-4 w-4 text-gray-500" />
                Live Preview
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                {(
                  [
                    ["desktop", Monitor],
                    ["tablet", Tablet],
                    ["mobile", Smartphone],
                  ] as const
                ).map(([id, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewDevice(id)}
                    className={`rounded-md p-2 transition-colors ${
                      previewDevice === id
                        ? "bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                    aria-label={id}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-100/70">
              <MaintenancePage
                preview
                previewWidth={previewDevice}
                settings={settings}
                companyName={companyMeta.company || ""}
                logoUrl={companyMeta.logo || ""}
                socialLinks={companyMeta.socialLinks}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer — content area only (not under sidebar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <button
              type="button"
              onClick={openFullPreview}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Preview Maintenance Page
            </button>
            {settings.enabled ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Disable Maintenance Mode
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                Enable Maintenance Mode
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave()}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              {saving ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : savedFeedback ? "Saved" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
