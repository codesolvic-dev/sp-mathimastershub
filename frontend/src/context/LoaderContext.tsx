import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { updateCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { COMPANY_UPDATED_EVENT, setCompanyCache } from "@/utils/companyCache";
import { fetchCompanyShared } from "@/utils/companyFetch";
import {
  getBrandNameFontStyle,
  type BrandNameFontStyle,
} from "@/utils/brandNameFont";
import {
  isLoaderSettingsSaved,
  LOADER_STORAGE_KEYS,
  readLoaderSettingsFromStorage,
  resolveInitialLoaderSettings,
  writeLoaderSettingsToStorage,
  type LoaderSettingsPayload,
  type LoaderDisplayMode,
  type LoaderMode,
} from "@/utils/loaderSettings";

export type { LoaderDisplayMode, LoaderMode };

/** Message loader – text shown under the spinner. Pick ONE. */
export interface LoaderMessagePreset {
  id: string;
  label: string;
  message: string;
  description?: string;
  isCustom?: boolean;
}

/** Brand presets that resolve to Company → name (not hardcoded SpFolio / legacy brand ids). */
export const COMPANY_LOADER_PRESET_IDS = new Set(["company", "spfolio", "gracebyanu", "splorem"]);

export const LOADER_MESSAGE_PRESETS: LoaderMessagePreset[] = [
  {
    id: "company",
    label: "Company name",
    message: "",
    description: "Company Brand",
  },
  { id: "loading", label: "Loading...", message: "Loading...", description: "Generic" },
  { id: "please_wait", label: "Please wait...", message: "Please wait...", description: "Polite" },
  { id: "minimal", label: "Minimal", message: "...", description: "Just dots" },
  { id: "custom", label: "Custom", message: "", description: "Use your own text", isCustom: true },
];

/** Spinner loader – animation style. Pick ONE. Separate from message. */
export interface LoaderStyleOption {
  id: string;
  label: string;
  description?: string;
  spinnerClass: string;
}

export const LOADER_STYLES: LoaderStyleOption[] = [
  { id: "default", label: "Default", description: "Gradient mask", spinnerClass: "default" },
  { id: "arc", label: "Circular arc", description: "Spinning arc", spinnerClass: "arc" },
  { id: "arc-thin", label: "Thin arc", description: "Thinner spinning arc", spinnerClass: "arc-thin" },
  { id: "bars", label: "Vertical bars", description: "Equalizer style", spinnerClass: "bars" },
  { id: "solid-circle", label: "Solid circle", description: "Pulsing circle", spinnerClass: "solid-circle" },
  { id: "dotted-circle", label: "Dotted circle", description: "Dots on ring", spinnerClass: "dotted-circle" },
  { id: "dots-horizontal", label: "Horizontal dots", description: "Three dots", spinnerClass: "dots-horizontal" },
  { id: "dots-grid", label: "Dot grid", description: "3×3 grid", spinnerClass: "dots-grid" },
  { id: "pinwheel", label: "Pinwheel", description: "Quadrant circle", spinnerClass: "pinwheel" },
];

/** For "single" mode: one card = one loader (message + spinner). 14 options – pick only ONE. */
export interface LoaderOption {
  id: string;
  label: string;
  message: string;
  presetId: string;
  styleId: string;
  description?: string;
  isCustom?: boolean;
}

export const LOADER_OPTIONS: LoaderOption[] = [
  {
    id: "company",
    label: "Company name",
    message: "",
    presetId: "company",
    styleId: "arc-thin",
    description: "From Company settings",
  },
  { id: "loading", label: "Loading...", message: "Loading...", presetId: "loading", styleId: "arc", description: "Generic" },
  { id: "please_wait", label: "Please wait...", message: "Please wait...", presetId: "please_wait", styleId: "bars", description: "Polite" },
  { id: "minimal", label: "Minimal", message: "...", presetId: "minimal", styleId: "dots-horizontal", description: "Just dots" },
  {
    id: "company-default",
    label: "Company (default)",
    message: "",
    presetId: "company",
    styleId: "default",
    description: "Brand, gradient",
  },
  {
    id: "company-arc",
    label: "Company (arc)",
    message: "",
    presetId: "company",
    styleId: "arc",
    description: "Brand, spinning arc",
  },
  { id: "loading-bars", label: "Loading...", message: "Loading...", presetId: "loading", styleId: "bars", description: "Generic, equalizer" },
  { id: "please_wait-dots", label: "Please wait...", message: "Please wait...", presetId: "please_wait", styleId: "dots-horizontal", description: "Polite, three dots" },
  { id: "minimal-dotted", label: "Minimal (ring)", message: "...", presetId: "minimal", styleId: "dotted-circle", description: "Dots on ring" },
  {
    id: "company-pinwheel",
    label: "Company (pinwheel)",
    message: "",
    presetId: "company",
    styleId: "pinwheel",
    description: "Brand, pinwheel",
  },
  { id: "custom", label: "Custom", message: "", presetId: "custom", styleId: "arc-thin", description: "Use your own text", isCustom: true },
];

const CUSTOM_ZIP_STYLE_ID = "custom-zip";

interface LoaderContextValue {
  loaderMessage: string;
  loaderStyleId: string;
  presetId: string;
  useCustomMessage: boolean;
  customMessage: string;
  loaderMode: LoaderMode;
  loaderDisplayMode: LoaderDisplayMode;
  messagePresets: LoaderMessagePreset[];
  loaderStyles: LoaderStyleOption[];
  loaderOptions: LoaderOption[];
  customZipCss: string | null;
  customZipLabel: string | null;
  /** Company brand name typography (navbarSettings) — applied on loader message */
  brandNameFontStyle: BrandNameFontStyle;
  setPresetId: (id: string) => void;
  setUseCustomMessage: (use: boolean) => void;
  setCustomMessage: (msg: string) => void;
  setLoaderStyleId: (id: string) => void;
  setLoaderMode: (mode: LoaderMode) => void;
  setLoaderDisplayMode: (mode: LoaderDisplayMode) => void;
  setLoaderFromOption: (presetId: string, styleId: string, isCustom?: boolean) => void;
  addCustomZipStyle: (css: string, label: string) => void;
  removeCustomZipStyle: () => void;
  save: () => Promise<void>;
}

const defaultPreset =
  LOADER_MESSAGE_PRESETS.find((p) => p.id === "company") ?? LOADER_MESSAGE_PRESETS[0];
const defaultStyleId = LOADER_STYLES[0].id;

function getCustomZipStyle(css: string | null, label: string | null): LoaderStyleOption | null {
  if (!css || !css.trim()) return null;
  return {
    id: CUSTOM_ZIP_STYLE_ID,
    label: label && label.trim() ? label.trim() : "From zip",
    description: "Custom spinner from zip",
    spinnerClass: "custom-zip",
  };
}

function normalizeStyleId(styleId: string | null | undefined): string {
  if (!styleId) return defaultStyleId;
  if (styleId === CUSTOM_ZIP_STYLE_ID) return styleId;
  if (styleId === "") return "";
  return LOADER_STYLES.some((s) => s.id === styleId) ? styleId : defaultStyleId;
}

function normalizePresetId(presetId: string | null | undefined): string {
  if (presetId === null || presetId === undefined) return defaultPreset.id;
  if (presetId === "") return "";
  // Legacy SpFolio / GraceByAnu / Splorem presets → live company name
  if (COMPANY_LOADER_PRESET_IDS.has(presetId)) return "company";
  return LOADER_MESSAGE_PRESETS.some((p) => p.id === presetId) ? presetId : defaultPreset.id;
}

function toLoaderSettingsPayload(settings: Partial<LoaderSettingsPayload>): LoaderSettingsPayload {
  return {
    saved: settings.saved === true,
    presetId: normalizePresetId(settings.presetId),
    useCustomMessage: settings.useCustomMessage === true,
    customMessage: settings.customMessage ?? "",
    loaderStyleId: normalizeStyleId(settings.loaderStyleId),
    loaderMode: settings.loaderMode === "single" ? "single" : "both",
    loaderDisplayMode:
      settings.loaderDisplayMode === "message_only" ||
      settings.loaderDisplayMode === "spinner_only" ||
      settings.loaderDisplayMode === "both"
        ? settings.loaderDisplayMode
        : "both",
    customZipCss: settings.customZipCss?.trim() ? settings.customZipCss : null,
    customZipLabel: settings.customZipLabel?.trim() ? settings.customZipLabel : null,
  };
}

function readInitialLoaderSettings(): LoaderSettingsPayload {
  const resolved = resolveInitialLoaderSettings();
  if (resolved) {
    return toLoaderSettingsPayload(resolved);
  }

  return toLoaderSettingsPayload({
    saved: false,
    presetId: defaultPreset.id,
    useCustomMessage: false,
    customMessage: "",
    loaderStyleId: defaultStyleId,
    loaderMode: "both",
    loaderDisplayMode: "both",
    customZipCss: null,
    customZipLabel: null,
  });
}

function readCompanyNameFromCache(): string {
  const cached = getCachedData<{ company?: string }>(CACHE_KEYS.COMPANY);
  return (cached?.company || "").trim();
}

function readBrandFontsFromCache(): { family?: string; weight?: string } {
  const cached = getCachedData<{
    navbarSettings?: { brandNameFontFamily?: string; brandNameFontWeight?: string };
  }>(CACHE_KEYS.COMPANY);
  return {
    family: cached?.navbarSettings?.brandNameFontFamily,
    weight: cached?.navbarSettings?.brandNameFontWeight,
  };
}

function resolveLoaderMessage(
  presetId: string,
  useCustomMessage: boolean,
  customMessage: string,
  companyName: string,
): string {
  if (!presetId) return "Loading...";
  if ((useCustomMessage || presetId === "custom") && customMessage.trim()) {
    return customMessage.trim();
  }
  if (COMPANY_LOADER_PRESET_IDS.has(presetId)) {
    return companyName.trim() || "Loading...";
  }
  const preset = LOADER_MESSAGE_PRESETS.find((p) => p.id === presetId) || defaultPreset;
  return preset.message || "Loading...";
}

const LoaderContext = createContext<LoaderContextValue | null>(null);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const initialSettings = readInitialLoaderSettings();

  const [presetId, setPresetIdState] = useState<string>(initialSettings.presetId);
  const [useCustomMessage, setUseCustomMessageState] = useState<boolean>(initialSettings.useCustomMessage);
  const [customMessage, setCustomMessageState] = useState<string>(initialSettings.customMessage);
  const [loaderStyleId, setLoaderStyleIdState] = useState<string>(
    initialSettings.loaderStyleId || defaultStyleId,
  );
  const [customZipCss, setCustomZipCssState] = useState<string | null>(initialSettings.customZipCss);
  const [customZipLabel, setCustomZipLabelState] = useState<string | null>(initialSettings.customZipLabel);
  const [loaderMode, setLoaderModeState] = useState<LoaderMode>(initialSettings.loaderMode);
  const [loaderDisplayMode, setLoaderDisplayModeState] = useState<LoaderDisplayMode>(
    initialSettings.loaderDisplayMode,
  );
  const [companyName, setCompanyName] = useState<string>(() => readCompanyNameFromCache());
  const [brandFonts, setBrandFonts] = useState(() => readBrandFontsFromCache());

  const brandNameFontStyle = useMemo(
    () => getBrandNameFontStyle(brandFonts.family, brandFonts.weight),
    [brandFonts.family, brandFonts.weight],
  );

  const customZipStyle = getCustomZipStyle(customZipCss, customZipLabel);
  const loaderStylesWithZip = customZipStyle ? [...LOADER_STYLES, customZipStyle] : LOADER_STYLES;

  const messagePresets = LOADER_MESSAGE_PRESETS.map((preset) => {
    if (preset.id !== "company") return preset;
    const name = companyName.trim() || "Company name";
    return {
      ...preset,
      label: name,
      message: name,
      description: "Company Brand",
    };
  });

  const loaderOptions = LOADER_OPTIONS.map((opt) => {
    if (opt.presetId !== "company") return opt;
    const name = companyName.trim() || "Company name";
    return { ...opt, label: opt.label.replace(/^Company/, name), message: name };
  });

  const loaderMessage = resolveLoaderMessage(
    presetId,
    useCustomMessage,
    customMessage,
    companyName,
  );

  const applyLoaderSettings = useCallback((settings: LoaderSettingsPayload) => {
    const normalized = toLoaderSettingsPayload(settings);
    setPresetIdState(normalized.presetId);
    setUseCustomMessageState(normalized.useCustomMessage);
    setCustomMessageState(normalized.customMessage);
    setLoaderStyleIdState(normalized.loaderStyleId || defaultStyleId);
    setLoaderModeState(normalized.loaderMode);
    setLoaderDisplayModeState(normalized.loaderDisplayMode);
    setCustomZipCssState(normalized.customZipCss);
    setCustomZipLabelState(normalized.customZipLabel);
    writeLoaderSettingsToStorage(normalized);
  }, []);

  const buildCurrentSettings = useCallback(
    (): LoaderSettingsPayload => ({
      saved: true,
      presetId,
      useCustomMessage,
      customMessage,
      loaderStyleId,
      loaderMode,
      loaderDisplayMode,
      customZipCss,
      customZipLabel,
    }),
    [
      presetId,
      useCustomMessage,
      customMessage,
      loaderStyleId,
      loaderMode,
      loaderDisplayMode,
      customZipCss,
      customZipLabel,
    ],
  );

  const save = useCallback(async () => {
    const payload = buildCurrentSettings();
    writeLoaderSettingsToStorage(payload);

    try {
      const updatedCompany = await updateCompany({
        loaderSettings: payload,
      });
      setCompanyCache({
        ...(updatedCompany || {}),
        loaderSettings: updatedCompany?.loaderSettings || payload,
      });
    } catch (error) {
      console.error("Failed to save loader settings:", error);
    }
  }, [buildCurrentSettings]);

  const setLoaderDisplayMode = useCallback((mode: LoaderDisplayMode) => {
    setLoaderDisplayModeState(mode);
  }, []);

  const setLoaderMode = useCallback((mode: LoaderMode) => {
    setLoaderModeState(mode);
  }, []);

  const setLoaderFromOption = useCallback((presetIdFromOption: string, styleIdFromOption: string, isCustom?: boolean) => {
    setPresetIdState(presetIdFromOption);
    setLoaderStyleIdState(styleIdFromOption);
    setUseCustomMessageState(!!isCustom);
  }, []);

  const setPresetId = useCallback((id: string) => {
    if (id !== "" && !LOADER_MESSAGE_PRESETS.some((p) => p.id === id)) return;
    setPresetIdState(id);
    if (id === "custom") setUseCustomMessageState(true);
    else setUseCustomMessageState(false);
  }, []);

  const setUseCustomMessage = useCallback((use: boolean) => {
    setUseCustomMessageState(use);
  }, []);

  const setCustomMessage = useCallback((msg: string) => {
    setCustomMessageState(msg);
  }, []);

  const setLoaderStyleId = useCallback((id: string) => {
    if (id !== "" && !loaderStylesWithZip.some((s) => s.id === id)) return;
    setLoaderStyleIdState(id);
  }, [loaderStylesWithZip]);

  const addCustomZipStyle = useCallback((css: string, label: string) => {
    setCustomZipCssState(css);
    setCustomZipLabelState(label || "From zip");
    setLoaderStyleIdState(CUSTOM_ZIP_STYLE_ID);
  }, []);

  const removeCustomZipStyle = useCallback(() => {
    setCustomZipCssState(null);
    setCustomZipLabelState(null);
    setLoaderStyleIdState((prev) => (prev === CUSTOM_ZIP_STYLE_ID ? defaultStyleId : prev));
  }, []);

  useEffect(() => {
    if (loaderStyleId === CUSTOM_ZIP_STYLE_ID && !customZipCss?.trim()) {
      setLoaderStyleIdState(defaultStyleId);
    }
  }, [customZipCss, loaderStyleId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOADER_STORAGE_KEYS.displayMode, loaderDisplayMode);
    } catch {
      /* ignore quota / private mode */
    }
  }, [loaderDisplayMode]);

  useEffect(() => {
    let cancelled = false;

    const syncFromServer = async () => {
      const cachedCompany = getCachedData<{
        company?: string;
        loaderSettings?: LoaderSettingsPayload;
        navbarSettings?: { brandNameFontFamily?: string; brandNameFontWeight?: string };
      }>(CACHE_KEYS.COMPANY);
      if (cachedCompany?.company?.trim()) {
        setCompanyName(cachedCompany.company.trim());
      }
      if (cachedCompany?.navbarSettings) {
        setBrandFonts({
          family: cachedCompany.navbarSettings.brandNameFontFamily,
          weight: cachedCompany.navbarSettings.brandNameFontWeight,
        });
      }
      if (cachedCompany?.loaderSettings && isLoaderSettingsSaved(cachedCompany.loaderSettings)) {
        applyLoaderSettings(cachedCompany.loaderSettings);
      }

      try {
        const company = await fetchCompanyShared();
        if (cancelled) return;

        if (company) setCompanyCache(company);

        const nextName = String(company?.company || "").trim();
        if (nextName) setCompanyName(nextName);

        if (company?.navbarSettings) {
          setBrandFonts({
            family: company.navbarSettings.brandNameFontFamily,
            weight: company.navbarSettings.brandNameFontWeight,
          });
        }

        if (company?.loaderSettings && isLoaderSettingsSaved(company.loaderSettings)) {
          applyLoaderSettings({
            ...company.loaderSettings,
            customZipCss: company.loaderSettings.customZipCss || null,
            customZipLabel: company.loaderSettings.customZipLabel || null,
          });
        }
      } catch {
        /* keep current settings */
      }
    };

    syncFromServer();

    const onCompanyUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | {
            company?: string;
            navbarSettings?: { brandNameFontFamily?: string; brandNameFontWeight?: string };
          }
        | undefined;
      if (!detail) return;
      if (detail.company?.trim()) setCompanyName(detail.company.trim());
      if (detail.navbarSettings) {
        setBrandFonts({
          family: detail.navbarSettings.brandNameFontFamily,
          weight: detail.navbarSettings.brandNameFontWeight,
        });
      }
    };
    window.addEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated as EventListener);
    };
  }, [applyLoaderSettings]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith("app_loader_")) return;
      const stored = readLoaderSettingsFromStorage();
      if (stored) {
        applyLoaderSettings(stored);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applyLoaderSettings]);

  return (
    <LoaderContext.Provider
      value={{
        loaderMessage,
        loaderStyleId,
        presetId,
        useCustomMessage,
        customMessage,
        loaderMode,
        loaderDisplayMode,
        messagePresets,
        loaderStyles: loaderStylesWithZip,
        loaderOptions,
        customZipCss,
        customZipLabel,
        brandNameFontStyle,
        setPresetId,
        setUseCustomMessage,
        setCustomMessage,
        setLoaderStyleId,
        setLoaderMode,
        setLoaderDisplayMode,
        setLoaderFromOption,
        addCustomZipStyle,
        removeCustomZipStyle,
        save,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader(): LoaderContextValue | null {
  return useContext(LoaderContext);
}
export const CUSTOM_ZIP_SPINNER_ID = CUSTOM_ZIP_STYLE_ID;
