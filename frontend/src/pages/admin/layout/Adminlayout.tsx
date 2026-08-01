import React, { useEffect, useState } from "react";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationBell from "@/components/admin/notifications/NotificationBell";
import { useNavigate } from "react-router-dom";
import PageLoader from "@/components/ui/PageLoader";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ImageIcon,
  Images,
  Settings,
  LogOut,
  Cog,
  Menu,
  MessageSquare,
  FileText,
  FolderTree,
  Star,
  Users,
  BarChart3,
  ChevronDown,
  Ticket,
  Home,
  BookOpen,
  Newspaper,
  Grid,
  Boxes,
  Store,
  SlidersHorizontal,
  Warehouse,
  ScrollText,
  Shield,
} from "lucide-react";

import { getMe } from "@/api/auth.api";
import { getEnabledAdminTabs } from "@/api/admintab.api";
import { getEnabledCatalogTypes } from "@/api/catalogtype.api";
import { getPolicies } from "@/api/content.api";
import {
  DEFAULT_POLICY_PAGES,
  mapPoliciesToConfig,
  POLICIES_UPDATED_EVENT,
  type PolicyPageConfig,
} from "@/config/policyPages";
import { getCachedData, setCachedData, CACHE_KEYS } from "@/utils/cache";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Only icons we need for admin tabs — avoid importing entire lucide-react namespace. */
const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  ImageIcon,
  Images,
  Settings,
  LogOut,
  Cog,
  Menu,
  MessageSquare,
  FileText,
  FolderTree,
  Star,
  Users,
  BarChart3,
  ChevronDown,
  Ticket,
  Home,
  BookOpen,
  Newspaper,
  Grid,
  Boxes,
  Store,
  SlidersHorizontal,
  Warehouse,
  Shield,
};

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  adminAccess?: boolean;
  adminTabAccess?: string[];
  avatar?: string;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
}

const DEFAULT_MENU: MenuItem[] = [
  { label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
  { label: "Orders", icon: ShoppingCart, path: "/admin/orders" },
  { label: "Categories", icon: FolderTree, path: "/admin/categories" },
  { label: "Catalog", icon: FileText, path: "/admin/catalog" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Coupons", icon: Ticket, path: "/admin/coupons" },
  { label: "Assets Panel", icon: ImageIcon, path: "/admin/assets" },
  { label: "Policies", icon: ScrollText, path: "/admin/policies" },
  { label: "Media Library", icon: Images, path: "/admin/media" },
  { label: "Queries", icon: MessageSquare, path: "/admin/queries" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
  { label: "Operators", icon: Users, path: "/admin/operators" },
  { label: "Admin Login", icon: Shield, path: "/admin/admins" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
  { label: "Control Panel", icon: SlidersHorizontal, path: "/admin/control-panel" },
];

/** Ensure Policies dropdown appears even when menu comes from admin tabs API. */
function ensurePoliciesInMenu(items: MenuItem[]): MenuItem[] {
  if (items.some((i) => i.path === "/admin/policies")) return items;
  const policiesItem: MenuItem = {
    label: "Policies",
    icon: ScrollText,
    path: "/admin/policies",
  };
  const assetsIdx = items.findIndex((i) => i.path === "/admin/assets");
  if (assetsIdx >= 0) {
    const next = [...items];
    next.splice(assetsIdx + 1, 0, policiesItem);
    return next;
  }
  return [...items, policiesItem];
}

function buildMenuFromTabs(tabs: any[]): MenuItem[] {
  if (!tabs?.length) return DEFAULT_MENU;
  const menuItems: MenuItem[] = tabs
    .filter((tab: any) => tab.path !== "/admin/sp-console")
    .map((tab: any) => {
      const IconComponent = LUCIDE_ICON_MAP[tab.icon] || LayoutDashboard;
      const path = tab.path === "/admin/blogs" ? "/admin/catalog" : tab.path;
      const label = tab.path === "/admin/blogs" ? "Catalog" : tab.label;
      return { label, icon: IconComponent, path };
    });
  return ensurePoliciesInMenu(menuItems);
}

function readStoredUser(): UserType | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserType;
  } catch {
    return null;
  }
}

function normalizeAvatarUrl(avatar?: string | null): string | undefined {
  if (!avatar) return undefined;
  const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((url: string) => url.trim()).filter(Boolean);
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const API_BASE_URL = isLocalhost ? urls[0] : urls[1] || urls[0] || import.meta.env.VITE_API_URL || "";
  const apiBaseWithoutApi = API_BASE_URL ? API_BASE_URL.replace("/api", "") : "";

  let avatarUrl = avatar;
  if (avatarUrl.includes("localhost") || avatarUrl.includes("127.0.0.1")) {
    const urlPath = avatarUrl.replace(/^https?:\/\/[^/]+/, "");
    avatarUrl = `${apiBaseWithoutApi}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
  } else if (!(avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://"))) {
    avatarUrl = `${apiBaseWithoutApi}${avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`}`;
  }
  return avatarUrl;
}

function filterMenuForUser(menuItems: MenuItem[], currentUser: UserType | null): MenuItem[] {
  if (!currentUser) return menuItems;
  const isAdmin = currentUser.role?.toLowerCase() === "admin";
  const allowed = new Set(currentUser.adminTabAccess || []);

  // Full admin with no tab restrictions → all menus
  if (isAdmin && allowed.size === 0) return menuItems;

  if (!isAdmin && !currentUser.adminAccess) return [];

  // Restricted admin or operator: only allowed tabs
  if (!isAdmin && allowed.size === 0) return [];

  return menuItems.filter((item) => {
    if (item.path === "/admin/policies") {
      return allowed.has("/admin/assets") || allowed.has("/admin/policies");
    }
    if (item.path === "/admin/catalog") {
      return allowed.has("/admin/catalog") || allowed.has("/admin/blogs");
    }
    return allowed.has(item.path);
  });
}

export default function AdminLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const storedUser = readStoredUser();
  const [user, setUser] = useState<UserType | null>(() =>
    storedUser
      ? { ...storedUser, avatar: normalizeAvatarUrl(storedUser.avatar) }
      : null
  );
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const cached = getCachedData<any[]>(CACHE_KEYS.ADMIN_TABS);
    const built = cached ? buildMenuFromTabs(cached) : DEFAULT_MENU;
    return filterMenuForUser(built, storedUser);
  });
  const [catalogTypes, setCatalogTypes] = useState<{ _id: string; slug: string; label: string }[]>(() => {
    const cached = getCachedData<{ _id: string; slug: string; label: string }[]>(CACHE_KEYS.CATALOG_TYPES);
    return Array.isArray(cached) ? cached : [];
  });
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [policyPages, setPolicyPages] = useState<PolicyPageConfig[]>(DEFAULT_POLICY_PAGES);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Only block first paint when we have no stored session to paint with. */
  const [initialLoading, setInitialLoading] = useState(() => !storedUser || !localStorage.getItem("token"));

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Paint shell immediately when we already have a session; refresh in background.
      if (user) setInitialLoading(false);

      try {
        const [userData, tabs, types, policies] = await Promise.all([
          getMe(token).catch(() => null),
          getEnabledAdminTabs().catch(() => null),
          getEnabledCatalogTypes().catch(() => []),
          getPolicies(false).catch(() => null),
        ]);

        if (cancelled) return;

        if (!userData) {
          navigate("/login");
          return;
        }

        const fullUser: UserType = {
          ...userData.user,
          avatar: normalizeAvatarUrl(userData.user.avatar),
        };
        setUser(fullUser);

        const isAdmin = fullUser.role?.toLowerCase() === "admin";
        if (!isAdmin && !fullUser.adminAccess) {
          navigate("/login");
          return;
        }

        if (Array.isArray(types)) {
          setCatalogTypes(types);
          setCachedData(CACHE_KEYS.CATALOG_TYPES, types);
        }

        if (Array.isArray(policies)) {
          setPolicyPages(mapPoliciesToConfig(policies));
        }
        if (tabs) {
          setMenu(filterMenuForUser(buildMenuFromTabs(tabs), fullUser));
          setCachedData(CACHE_KEYS.ADMIN_TABS, tabs);
        } else {
          setMenu((prev) => filterMenuForUser(prev, fullUser));
        }
      } catch (err) {
        console.log(err);
        if (!cancelled && !user) navigate("/login");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    loadAll();

    const onPoliciesUpdated = () => {
      getPolicies(false)
        .then((list) => setPolicyPages(mapPoliciesToConfig(list)))
        .catch(() => {});
    };
    window.addEventListener(POLICIES_UPDATED_EVENT, onPoliciesUpdated);

    // Prefetch admin page chunks after paint — defer heavy data warm so shell stays snappy
    if (typeof window !== "undefined") {
      const prefetchChunks = () => {
        void import("../pages/DashboardPage");
        void import("../pages/ProductPage");
        void import("../pages/OrdersPage");
        void import("../pages/SettingsPage");
      };

      const warmListCaches = () => {
        void Promise.all([
          import("@/api/order.api"),
          import("@/api/product.api"),
          import("@/api/category.api"),
        ]).then(async ([orderApi, productApi, categoryApi]) => {
          try {
            const [ordersData, products, categories] = await Promise.all([
              orderApi.fetchOrders().catch(() => null),
              productApi.getProducts().catch(() => null),
              categoryApi.getCategories().catch(() => null),
            ]);
            if (ordersData) {
              const list = Array.isArray(ordersData)
                ? ordersData
                : Array.isArray((ordersData as { data?: unknown })?.data)
                  ? (ordersData as { data: unknown[] }).data
                  : [];
              if (list.length) {
                setCachedData(
                  CACHE_KEYS.ADMIN_ORDERS,
                  list.map((o: any) => ({ ...o, id: o._id })),
                  45 * 1000
                );
              }
            }
            if (Array.isArray(products) && Array.isArray(categories)) {
              const mapped = products.map((p: any) => {
                let categoryId = "";
                let categoryName = "Unknown";
                if (typeof p.category === "string") {
                  categoryId = p.category;
                  const cat = categories.find((c: any) => c._id === p.category);
                  if (cat) categoryName = cat.name;
                } else if (p.category?._id) {
                  categoryId = p.category._id;
                  categoryName = p.category.name || "Unknown";
                }
                return { ...p, id: p._id, category: categoryId, categoryName };
              });
              setCachedData(
                CACHE_KEYS.ADMIN_PRODUCTS,
                { products: mapped, categories },
                90 * 1000
              );
            }
          } catch {
            /* ignore prefetch failures */
          }
        });
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(prefetchChunks, { timeout: 3500 });
        window.requestIdleCallback(warmListCaches, { timeout: 12000 });
      } else {
        setTimeout(prefetchChunks, 1200);
        setTimeout(warmListCaches, 6000);
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener(POLICIES_UPDATED_EVENT, onPoliciesUpdated);
    };
  }, [navigate]);

  // Keep a short session gate only when we have no stored user at all
  if (initialLoading) {
    return <PageLoader />;
  }

  const isAdminUser = user?.role?.toLowerCase() === "admin";
  const operatorTabPaths = new Set(user?.adminTabAccess || []);
  const showSpConsole = isAdminUser || operatorTabPaths.has("/admin/sp-console");

  // Sidebar content component (reusable for both desktop and mobile)
  // Sidebar content – same structure and styling as DeveloperLayout
  const roleLabel = isAdminUser
    ? "Admin"
    : user?.role
      ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
      : "Operator";
  const displayName = user?.name?.trim() || "User";
  const displayEmail = user?.email?.trim() || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const UserAvatar = ({
    size = "md",
    variant = "light",
  }: {
    size?: "sm" | "md";
    variant?: "light" | "dark";
  }) => {
    const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt={displayName}
          className={`${sizeClass} rounded-full object-cover shrink-0 ${
            variant === "dark" ? "border border-white/30 bg-white/10" : "border border-gray-200 bg-gray-100"
          }`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full shrink-0 flex items-center justify-center font-semibold text-white ${
          variant === "dark" ? "border border-white/30" : ""
        }`}
        style={{ backgroundColor: variant === "dark" ? "var(--theme-dark)" : "var(--theme-primary)" }}
        aria-hidden
      >
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const UserProfileDropdown = ({
    compact = false,
    sidebar = false,
    onNavigate,
  }: {
    compact?: boolean;
    sidebar?: boolean;
    onNavigate?: () => void;
  }) => {
    if (!user) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={
              sidebar
                ? "inline-flex items-center gap-2 rounded-lg min-w-0 max-w-full px-1.5 py-1.5 text-left hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                : `inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/25 ${
                    compact ? "h-10 px-2" : "h-10 pl-1.5 pr-2.5"
                  }`
            }
            aria-label="User profile menu"
          >
            <UserAvatar size="sm" variant={sidebar ? "dark" : "light"} />
            {!compact && (
              <>
                <span
                  className={`flex flex-col items-start min-w-0 ${
                    sidebar ? "max-w-[120px]" : "hidden sm:flex max-w-[140px]"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold truncate w-full text-left ${
                      sidebar ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {displayName}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wide ${
                      sidebar ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {roleLabel}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 ${sidebar ? "text-white/70" : "text-gray-400"}`}
                />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={sidebar ? "start" : "end"}
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          className="w-64 !bg-white !text-gray-900 border border-gray-200 shadow-xl z-[9999] overflow-hidden rounded-xl p-1"
        >
          <DropdownMenuLabel className="font-normal bg-white">
            <div className="flex items-start gap-3 py-1.5 px-1">
              <UserAvatar />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                {displayEmail ? (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{displayEmail}</p>
                ) : null}
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mt-1">
                  {roleLabel}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-gray-100">
            <Link
              to="/admin/settings"
              className="flex items-center gap-2"
              onClick={() => onNavigate?.()}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={() => {
              handleLogout();
              onNavigate?.();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Profile dropdown + notification bell */}
      <div className="px-3 pt-5 pb-5 border-b border-white/20 shrink-0 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <UserProfileDropdown sidebar onNavigate={onLinkClick} />
        </div>
        <div className="hidden lg:block shrink-0">
          <NotificationBell />
        </div>
      </div>

      {/* MENU – Dashboard, Catalog (dropdown) & Settings; same link style as DeveloperLayout */}
      <nav className="flex flex-col gap-2 mt-6 px-2 flex-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon;
          const isCatalog = item.path === "/admin/catalog";
          const isPolicies = item.path === "/admin/policies";
          const catalogActive = loc.pathname.startsWith("/admin/catalog");
          const searchParams = new URLSearchParams(loc.search);
          const activePolicyTab = searchParams.get("tab");
          const policiesActive =
            loc.pathname === "/admin/assets" &&
            !!activePolicyTab &&
            policyPages.some((p) => p.id === activePolicyTab);
          const active = isCatalog
            ? catalogActive
            : isPolicies
              ? policiesActive
              : item.path === "/admin/assets"
                ? loc.pathname === "/admin/assets" && !policiesActive
                : loc.pathname === item.path;

          if (isCatalog) {
            return (
              <div key={item.path}>
                <button
                  type="button"
                  onClick={() => setCatalogOpen((o) => !o)}
                  className={`flex items-center justify-between w-full gap-3 px-4 py-2.5 rounded-lg transition
                  ${active ? "text-white font-semibold shadow-md" : "hover:bg-white/10"}`}
                  style={{
                    backgroundColor: active ? "var(--theme-dark)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${catalogOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {catalogOpen && catalogTypes.length > 0 && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-white/20 pl-3">
                    {catalogTypes.map((ct) => {
                      const typePath = `/admin/catalog/${ct.slug}`;
                      const typeActive = loc.pathname === typePath;
                      return (
                        <Link
                          key={ct._id}
                          to={typePath}
                          onClick={onLinkClick}
                          className={`block px-3 py-2 rounded-md text-sm transition
                          ${typeActive ? "text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                          style={{
                            backgroundColor: typeActive ? "var(--theme-dark)" : "transparent",
                          }}
                        >
                          {ct.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
                {catalogOpen && catalogTypes.length === 0 && (
                  <Link
                    to="/admin/catalog/blog"
                    onClick={onLinkClick}
                    className={`ml-4 mt-1 block px-4 py-2 rounded-md text-sm ${catalogActive ? "text-white font-semibold" : "text-white/80 hover:text-white"}`}
                    style={{
                      backgroundColor: catalogActive ? "var(--theme-dark)" : "transparent",
                    }}
                  >
                    Blog
                  </Link>
                )}
              </div>
            );
          }

          if (isPolicies) {
            return (
              <div key={item.path}>
                <button
                  type="button"
                  onClick={() => setPoliciesOpen((o) => !o)}
                  className={`flex items-center justify-between w-full gap-3 px-4 py-2.5 rounded-lg transition
                  ${active ? "text-white font-semibold shadow-md" : "hover:bg-white/10"}`}
                  style={{
                    backgroundColor: active ? "var(--theme-dark)" : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${policiesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {policiesOpen && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-white/20 pl-3">
                    {policyPages.map((policy) => {
                      const typeActive =
                        loc.pathname === "/admin/assets" && activePolicyTab === policy.id;
                      return (
                        <Link
                          key={policy.id}
                          to={policy.adminPath}
                          onClick={onLinkClick}
                          className={`block px-3 py-2 rounded-md text-sm transition
                          ${typeActive ? "text-white font-semibold" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                          style={{
                            backgroundColor: typeActive ? "var(--theme-dark)" : "transparent",
                          }}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span>{policy.label}</span>
                            {policy.enabled === false && (
                              <span className="text-[10px] uppercase tracking-wide text-white/50">
                                Off
                              </span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                    {/* <Link
                      to="/admin/assets?tab=privacy&add=1"
                      onClick={onLinkClick}
                      className="block px-3 py-2 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 border-t border-white/10 mt-1"
                    >
                      + Add Policy
                    </Link> */}
                  </div>
                )}
              </div>
            );
          }

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

      {/* SP CONSOLE & LOGOUT (bottom – position and logic unchanged) */}
      <div className="mt-auto px-2 shrink-0 space-y-2">
        {/* {showSpConsole && (
          <Link
            to="/admin/sp-console"
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition w-full
            ${loc.pathname === "/admin/sp-console" ? "text-white font-semibold shadow-md" : "hover:bg-white/10 text-white/80 hover:text-white"}`}
            style={{
              backgroundColor: loc.pathname === "/admin/sp-console" ? "var(--theme-dark)" : "transparent",
            }}
          >
            <Cog size={18} />
            Sp Console
          </Link>
        )} */}
        <button
          onClick={() => {
            handleLogout();
            if (onLinkClick) onLinkClick();
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 w-full text-white/80 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <NotificationProvider>
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      {/* ============ MOBILE TOP BAR ============ */}
      <div className="lg:hidden fixed top-4 left-4 right-4 z-[100] flex items-center justify-between gap-2">
        <Button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="h-10 w-10 p-0 bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-lg rounded-lg flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg shadow-lg border-2 border-gray-300"
            style={{ background: "var(--theme-dark, #1e293b)" }}
          >
            <NotificationBell />
          </div>
          <UserProfileDropdown compact />
        </div>
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

      {/* ============ DESKTOP SIDEBAR ============ */}
      <aside
        className="hidden lg:flex w-64 shrink-0 text-white flex-col shadow-lg fixed left-0 top-0 h-screen overflow-y-auto z-50"
        style={{
          background: `linear-gradient(to bottom, var(--theme-dark), var(--theme-primary))`,
        }}
      >
        <SidebarContent />
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <main className="relative flex-1 min-w-0 max-w-full pt-16 lg:pt-0 bg-gray-50 text-black lg:ml-64 overflow-x-hidden">
        <div className="w-full max-w-full min-w-0 box-border p-4 sm:p-6 lg:p-8">
          <React.Suspense fallback={<PageLoader />}>
            <div className="w-full max-w-full min-w-0 overflow-x-hidden" style={{ color: "#000000" }}>
              <Outlet />
            </div>
          </React.Suspense>
        </div>
      </main>
    </div>
    </NotificationProvider>
  );
}
