import type { ContentPage } from "@/api/content.api";

export type PolicyPageConfig = {
  id: string;
  label: string;
  contentType: string;
  adminPath: string;
  storePath: string;
  enabled?: boolean;
  isSystem?: boolean;
};

/** Map API policy docs to sidebar/config shape. */
export function mapPoliciesToConfig(policies: ContentPage[]): PolicyPageConfig[] {
  return (policies || []).map((p) => ({
    id: p.type,
    label: p.label || p.title || p.type,
    contentType: p.type,
    adminPath: `/admin/assets?tab=${encodeURIComponent(p.type)}`,
    storePath: p.storePath || `/policy/${p.type}`,
    enabled: p.enabled !== false,
    isSystem: !!p.isSystem,
  }));
}

/** Fallback defaults before API loads (and for SSR-safe first paint). */
export const DEFAULT_POLICY_PAGES: PolicyPageConfig[] = [
  {
    id: "privacy",
    label: "Privacy Policy",
    contentType: "privacy",
    adminPath: "/admin/assets?tab=privacy",
    storePath: "/privacy-policy",
    enabled: true,
    isSystem: true,
  },
  {
    id: "terms",
    label: "Terms & Conditions",
    contentType: "terms",
    adminPath: "/admin/assets?tab=terms",
    storePath: "/terms-conditions",
    enabled: true,
    isSystem: true,
  },
  {
    id: "refund",
    label: "Refund Policy",
    contentType: "refund",
    adminPath: "/admin/assets?tab=refund",
    storePath: "/refund-policy",
    enabled: true,
    isSystem: true,
  },
  {
    id: "shipping",
    label: "Shipping Policy",
    contentType: "shipping",
    adminPath: "/admin/assets?tab=shipping",
    storePath: "/shipping-policy",
    enabled: true,
    isSystem: true,
  },
  {
    id: "return",
    label: "Return Policy",
    contentType: "return",
    adminPath: "/admin/assets?tab=return",
    storePath: "/return-policy",
    enabled: true,
    isSystem: true,
  },
];

/** @deprecated Use getPolicies() + mapPoliciesToConfig — kept for gradual migration */
export const POLICY_PAGES = DEFAULT_POLICY_PAGES;

export const POLICY_TAB_IDS = DEFAULT_POLICY_PAGES.map((p) => p.id);

export function getPolicyByTab(
  tab: string | null | undefined,
  policies: PolicyPageConfig[] = DEFAULT_POLICY_PAGES
): PolicyPageConfig | undefined {
  if (!tab) return undefined;
  return policies.find((p) => p.id === tab);
}

export function isPolicyTab(
  tab: string | null | undefined,
  policies: PolicyPageConfig[] = DEFAULT_POLICY_PAGES
): boolean {
  if (!tab) return false;
  if (tab === "banners" || tab === "banner2" || tab === "faq") return false;
  return policies.some((p) => p.id === tab) || /^[a-z][a-z0-9-]{1,48}$/.test(tab);
}

/** Dispatched when admin creates/updates policies so sidebar can refresh. */
export const POLICIES_UPDATED_EVENT = "sp-policies-updated";

export function notifyPoliciesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(POLICIES_UPDATED_EVENT));
  }
}
