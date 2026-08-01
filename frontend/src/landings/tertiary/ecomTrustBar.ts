import { Flag, Package, Banknote, Headset, Truck, Box, type LucideIcon } from "lucide-react";
import { contentOverride } from "@/utils/landingSectionContent";

export const ECOM_TRUST_BAR_SECTION_ID = "ecom-trust-bar";

export type TrustBarIconKey = "flag" | "package" | "banknote" | "headset" | "truck" | "box";

export const TRUST_BAR_ICON_MAP: Record<TrustBarIconKey, LucideIcon> = {
  flag: Flag,
  package: Package,
  banknote: Banknote,
  headset: Headset,
  truck: Truck,
  box: Box,
};

export const DEFAULT_TRUST_BAR_ITEMS_RAW = [
  "package|Easy 30-day exchange|Have Arrange team.",
  "box|Best Quality|Serve with own applications.",
  "headset|Online Support|Give support on your availability",
  "truck|Ships across Pakistan|Follow system driven approach",
].join("\n");

export type EcomTrustBarItem = {
  icon: LucideIcon;
  label: string;
  description?: string;
};

export function parseEcomTrustBarItems(
  contentMap?: Record<string, Record<string, string>>
): EcomTrustBarItem[] {
  const raw = contentOverride(
    contentMap ?? {},
    ECOM_TRUST_BAR_SECTION_ID,
    "items",
    DEFAULT_TRUST_BAR_ITEMS_RAW
  );

  const lines = String(raw)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const source =
    lines.length > 0 ? lines : DEFAULT_TRUST_BAR_ITEMS_RAW.split("\n").map((l) => l.trim()).filter(Boolean);

  return source.map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    const iconKey = (parts[0] || "flag").toLowerCase();
    const label = parts[1] || "Trust item";
    const description = parts[2] || "";
    const Icon = TRUST_BAR_ICON_MAP[iconKey as TrustBarIconKey] || Flag;
    return { icon: Icon, label, description: description || undefined };
  });
}
