import type { LandingSectionPage } from "@/landings/types";

export type LandingPageChoice = "primary" | "secondary" | "tertiary";

export const DEFAULT_LANDING_PAGE: LandingPageChoice = "primary";

export const LANDING_PAGE_OPTIONS: {
  value: LandingPageChoice;
  label: string;
  description: string;
}[] = [
  {
    value: "primary",
    label: "E-commerce",
    description: "Products, categories, banners (classic shop home)",
  },
  {
    value: "secondary",
    label: "Sp Folio",
    description: "Portfolio, services, dynamic sections (Navbar2)",
  },
  {
    value: "tertiary",
    label: "Sp eCom",
    description: "E-commerce home with draggable sections (Hero, Categories, Shop Items)",
  },
];

export function normalizeLandingPageChoice(value: unknown): LandingPageChoice {
  if (value === "secondary") return "secondary";
  if (value === "tertiary") return "tertiary";
  return "primary";
}

export function resolveHomeLanding(choice: unknown): LandingPageChoice {
  return normalizeLandingPageChoice(choice);
}

export function resolveAlternateLanding(choice: unknown): LandingPageChoice {
  const home = resolveHomeLanding(choice);
  if (home === "primary") return "secondary";
  if (home === "secondary") return "tertiary";
  return "primary";
}
