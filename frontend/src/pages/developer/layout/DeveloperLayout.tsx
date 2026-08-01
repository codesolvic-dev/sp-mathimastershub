import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  PanelBottom,
  PanelTop,
  ArrowLeft,
  Menu,
  Package,
  FolderTree,
  LayoutTemplate,
  Loader2,
  ShoppingBag,
  LayoutList,
  SlidersHorizontal,
  Plug,
  ChevronDown,
  Activity,
  Search,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import PageLoader from "@/components/ui/PageLoader";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { fetchCompanyShared } from "@/utils/companyFetch";

function companyAssetUrl(path: string): string {
  const p = (path || "").trim();
  if (!p) return "";
  if (p.startsWith("http")) return p;
  const apiUrl = typeof import.meta.env.VITE_API_URL === "string" ? import.meta.env.VITE_API_URL : "";
  return `${apiUrl.replace(/\/$/, "")}${p.startsWith("/") ? "" : "/"}${p}`;
}

type MenuLink = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
};

type MenuGroup = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: MenuLink[];
};

type MenuItem = MenuLink | MenuGroup;

function isMenuGroup(item: MenuItem): item is MenuGroup {
  return "children" in item && Array.isArray(item.children);
}

const THIRD_PARTY_CHILDREN: MenuLink[] = [
  {
    label: "Meta Pixel",
    icon: Activity,
    path: "/developer/third-party-services/meta-pixel",
  },
  {
    label: "Google Search Console",
    icon: Search,
    path: "/developer/third-party-services/google-search-console",
  },
];

export default function DeveloperLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const thirdPartyActive = loc.pathname.startsWith("/developer/third-party-services");
  const [thirdPartyOpen, setThirdPartyOpen] = useState(thirdPartyActive);

  useEffect(() => {
    if (thirdPartyActive) setThirdPartyOpen(true);
  }, [thirdPartyActive]);

  useEffect(() => {
    try {
      sessionStorage.removeItem("force-maintenance-preview");
    } catch {
      // ignore
    }
  }, []);
  const isSpEcomBuilder = /^\/developer\/sp-ecom\/[^/]+\/builder$/.test(loc.pathname);
  const isSectionsPage = loc.pathname.startsWith("/developer/sections");
  const isFullWidthPage = isSpEcomBuilder || isSectionsPage;

  useEffect(() => {
    const apply = (c: { favicon?: string; logo?: string } | null | undefined) => {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      const fav = c?.favicon?.trim();
      const logo = c?.logo?.trim();
      if (fav) {
        link.href = companyAssetUrl(fav);
      } else if (logo) {
        link.href = companyAssetUrl(logo);
      } else {
        link.href = "/logo-removebg-preview.png";
      }
    };
    const cached = getCachedData<{ favicon?: string; logo?: string }>(CACHE_KEYS.COMPANY);
    if (cached) apply(cached);
    fetchCompanyShared({ preferCache: true })
      .then((c) => apply(c))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const developerAuth = localStorage.getItem("developerAuth");
    if (!developerAuth) {
      navigate("/admin/sp-console");
      return;
    }
  }, [navigate]);

  // Prefetch only lightweight neighbor tabs after first paint — avoid SpEcom builder contention
  useEffect(() => {
    const prefetch = () => {
      void import("../pages/AdminTabsPage");
      void import("../pages/CompanyPage");
      void import("../pages/HeaderPage");
      void import("../pages/FooterPage");
      void import("../pages/MetaPixelPage");
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetch, 1500);
    return () => clearTimeout(t);
  }, []);

  const menu: MenuItem[] = [
    { label: "Control Panel", icon: SlidersHorizontal, path: "/developer/control-panel" },
    { label: "Admin Tabs", icon: LayoutDashboard, path: "/developer/admin-tabs" },
    { label: "Catalog Types", icon: FolderTree, path: "/developer/catalog-types" },
    { label: "Loader settings", icon: Loader2, path: "/developer/loader-settings" },
    { label: "Company", icon: Building2, path: "/developer/company" },
    { label: "Header", icon: PanelTop, path: "/developer/header" },
    { label: "Web Pages", icon: FileText, path: "/developer/web-pages" },
    { label: "Profile Pages", icon: FileText, path: "/developer/profile-pages" },
    { label: "Footer", icon: PanelBottom, path: "/developer/footer" },
    { label: "Sections", icon: LayoutList, path: "/developer/sections" },
    { label: "SpFolio", icon: LayoutTemplate, path: "/developer/spfolio" },
    { label: "Sp - eCom", icon: ShoppingBag, path: "/developer/sp-ecom" },
    {
      label: "Third-Party Services",
      icon: Plug,
      children: THIRD_PARTY_CHILDREN,
    },
    { label: "SP Components", icon: Package, path: "/developer/sp-components" },
  ];

  const handleBackToAdmin = () => {
    localStorage.removeItem("developerAuth");
    localStorage.removeItem("developerAuthTime");
    navigate("/admin/dashboard");
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-6 border-b border-white/20 shrink-0">
        <span
          className="font-bold text-sm tracking-wider"
          style={{ color: "var(--theme-accent)" }}
        >
          Developer
        </span>
      </div>

      <nav className="flex flex-col gap-2 mt-6 px-2 flex-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;

          if (isMenuGroup(item)) {
            const groupActive = item.children.some((child) => loc.pathname === child.path);
            const open = item.label === "Third-Party Services" ? thirdPartyOpen : groupActive;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.label === "Third-Party Services") {
                      setThirdPartyOpen((o) => !o);
                    }
                  }}
                  className={`flex items-center justify-between w-full gap-3 px-4 py-2.5 rounded-lg transition
                  ${groupActive ? "text-white font-semibold shadow-md" : "hover:bg-white/10"}`}
                  style={{
                    backgroundColor: groupActive ? "var(--theme-dark)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-white/20 pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = loc.pathname === child.path;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onLinkClick}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
                          ${childActive ? "text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                          style={{
                            backgroundColor: childActive ? "var(--theme-dark)" : "transparent",
                          }}
                        >
                          <ChildIcon size={15} className="shrink-0 opacity-90" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = loc.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition
              ${active ? "text-white font-semibold shadow-md" : "hover:bg-white/10"}`}
              style={{
                backgroundColor: active ? "var(--theme-dark)" : "transparent",
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 shrink-0">
        <button
          onClick={() => {
            handleBackToAdmin();
            if (onLinkClick) onLinkClick();
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 w-full text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Admin
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      {!isFullWidthPage && (
        <>
          <div className="lg:hidden fixed top-4 left-4 z-100">
            <Button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="h-10 w-10 p-0 bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-lg rounded-lg flex items-center justify-center"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent
              side="left"
              className="w-64 p-0 text-white border-0 [&>button]:text-white [&>button]:hover:text-white [&>button]:hover:bg-white/10"
              style={{
                background: `linear-gradient(to bottom, var(--theme-dark), var(--theme-primary))`,
              }}
            >
              <div className="flex flex-col h-full py-6">
                <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {!isFullWidthPage && (
        <aside
          className="hidden lg:flex w-64 text-white flex-col shadow-lg fixed left-0 top-0 h-screen overflow-y-auto"
          style={{
            background: `linear-gradient(to bottom, var(--theme-dark), var(--theme-primary))`,
          }}
        >
          <SidebarContent />
        </aside>
      )}

      <main
        className={`flex-1 w-full bg-gray-50 text-black ${
          isSpEcomBuilder
            ? "fixed inset-0 z-30 overflow-hidden p-0"
            : isSectionsPage
              ? "lg:ml-0 pt-16 lg:pt-0 p-0"
              : "lg:ml-64 pt-16 lg:pt-8 p-4 lg:p-8"
        }`}
      >
        <React.Suspense fallback={<PageLoader />}>
          <div
            className={isSpEcomBuilder ? "h-full min-h-0 overflow-hidden" : undefined}
            style={{ color: "#000000" }}
          >
            <Outlet />
          </div>
        </React.Suspense>
      </main>
    </div>
  );
}
