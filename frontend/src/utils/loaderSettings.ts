export type LoaderMode = "both" | "single";
export type LoaderDisplayMode = "both" | "message_only" | "spinner_only";

import { CACHE_KEYS, getCachedData } from "@/utils/cache";

export const LOADER_STORAGE_KEYS = {
  preset: "app_loader_preset",
  custom: "app_loader_custom_message",
  useCustom: "app_loader_use_custom",
  style: "app_loader_style",
  mode: "app_loader_mode",
  displayMode: "app_loader_display_mode",
  customZipCss: "app_loader_custom_zip_css",
  customZipLabel: "app_loader_custom_zip_label",
} as const;

export type LoaderSettingsPayload = {
  saved?: boolean;
  presetId: string;
  useCustomMessage: boolean;
  customMessage: string;
  loaderStyleId: string;
  loaderMode: LoaderMode;
  loaderDisplayMode: LoaderDisplayMode;
  customZipCss: string | null;
  customZipLabel: string | null;
};

export function isLoaderSettingsSaved(settings?: Partial<LoaderSettingsPayload> | null): boolean {
  return settings?.saved === true;
}

export function readLoaderSettingsFromStorage(): LoaderSettingsPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const presetId = localStorage.getItem(LOADER_STORAGE_KEYS.preset);
    const loaderStyleId = localStorage.getItem(LOADER_STORAGE_KEYS.style);
    const displayMode = localStorage.getItem(LOADER_STORAGE_KEYS.displayMode);
    const mode = localStorage.getItem(LOADER_STORAGE_KEYS.mode);

    if (presetId === null && loaderStyleId === null && displayMode === null) {
      return null;
    }

    return {
      saved: true,
      presetId: presetId ?? "",
      useCustomMessage:
        localStorage.getItem(LOADER_STORAGE_KEYS.useCustom) === "1" ||
        localStorage.getItem(LOADER_STORAGE_KEYS.useCustom) === "true",
      customMessage: localStorage.getItem(LOADER_STORAGE_KEYS.custom) || "",
      loaderStyleId: loaderStyleId ?? "",
      loaderMode: mode === "single" ? "single" : "both",
      loaderDisplayMode:
        displayMode === "message_only" || displayMode === "spinner_only" || displayMode === "both"
          ? displayMode
          : "both",
      customZipCss: localStorage.getItem(LOADER_STORAGE_KEYS.customZipCss),
      customZipLabel: localStorage.getItem(LOADER_STORAGE_KEYS.customZipLabel),
    };
  } catch {
    return null;
  }
}

export function writeLoaderSettingsToStorage(settings: LoaderSettingsPayload): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOADER_STORAGE_KEYS.preset, settings.presetId);
    localStorage.setItem(LOADER_STORAGE_KEYS.useCustom, settings.useCustomMessage ? "1" : "0");
    localStorage.setItem(LOADER_STORAGE_KEYS.custom, settings.customMessage);
    localStorage.setItem(LOADER_STORAGE_KEYS.style, settings.loaderStyleId);
    localStorage.setItem(LOADER_STORAGE_KEYS.mode, settings.loaderMode);
    localStorage.setItem(LOADER_STORAGE_KEYS.displayMode, settings.loaderDisplayMode);
    if (settings.customZipCss != null && settings.customZipCss.trim()) {
      localStorage.setItem(LOADER_STORAGE_KEYS.customZipCss, settings.customZipCss);
    } else {
      localStorage.removeItem(LOADER_STORAGE_KEYS.customZipCss);
    }
    if (settings.customZipLabel != null && settings.customZipLabel.trim()) {
      localStorage.setItem(LOADER_STORAGE_KEYS.customZipLabel, settings.customZipLabel);
    } else {
      localStorage.removeItem(LOADER_STORAGE_KEYS.customZipLabel);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function readLoaderSettingsFromCompanyCache(): LoaderSettingsPayload | null {
  const company = getCachedData<{ loaderSettings?: LoaderSettingsPayload }>(CACHE_KEYS.COMPANY);
  if (!company?.loaderSettings || !isLoaderSettingsSaved(company.loaderSettings)) {
    return null;
  }
  return company.loaderSettings;
}

export function resolveInitialLoaderSettings(): LoaderSettingsPayload | null {
  return readLoaderSettingsFromCompanyCache() ?? readLoaderSettingsFromStorage();
}
