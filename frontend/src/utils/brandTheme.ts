export type BrandThemeColors = {
  primary: string;
  dark: string;
  accent: string;
  light: string;
};

const DEFAULT_THEME: BrandThemeColors = {
  primary: "#8C5934",
  dark: "#6B4A2C",
  accent: "#f5e8dc",
  light: "#faf5f0",
};

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return `rgba(140, 89, 52, ${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getBrandThemeColors(theme?: Partial<BrandThemeColors> | null): BrandThemeColors {
  if (theme?.primary) {
    return {
      primary: theme.primary,
      dark: theme.dark || theme.primary,
      accent: theme.accent || theme.primary,
      light: theme.light || theme.primary,
    };
  }

  if (typeof window !== "undefined") {
    const root = getComputedStyle(document.documentElement);
    const primary = root.getPropertyValue("--theme-primary").trim();
    if (primary) {
      return {
        primary,
        dark: root.getPropertyValue("--theme-dark").trim() || primary,
        accent: root.getPropertyValue("--theme-accent").trim() || primary,
        light: root.getPropertyValue("--theme-light").trim() || primary,
      };
    }
  }

  return DEFAULT_THEME;
}
