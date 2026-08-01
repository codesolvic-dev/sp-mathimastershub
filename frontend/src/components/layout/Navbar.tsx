import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/buttons/Button";
import { AppSidebar } from "../app-sidebar";
import { useTheme } from "@/lib/ThemeProvider";
import { useCart } from "../products/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { Menu, ShoppingCart, LogOut, User, Heart } from "lucide-react";
import { getMe } from "@/api/auth.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import * as LucideIcons from "lucide-react";
import { buildWhatsAppUrl, resolveCompanyAssetUrl } from "@/utils/companyBrand";
import { COMPANY_UPDATED_EVENT } from "@/utils/companyCache";
import { fetchCompanyShared } from "@/utils/companyFetch";
import CartSidebar from "@/components/cart/CartSidebar";
import WishlistSidebar from "@/components/wishlist/WishlistSidebar";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { getUserWishlist } from "@/api/user.api";
import { useNavCategories } from "@/hooks/useNavCategories";
import { getBrandNameFontStyle } from "@/utils/brandNameFont";
import ShopNavLinks from "@/components/layout/ShopNavLinks";
import {
  normalizeNavbarSettings,
  type NavbarSettings,
  type TabsAlign,
} from "@/utils/navbarSettings";

type NavbarCompany = {
  logo: string;
  company: string;
  phone: string;
  brandNameFontFamily?: string;
  brandNameFontWeight?: string;
};

function readBrandNameFonts(company?: {
  navbarSettings?: { brandNameFontFamily?: string; brandNameFontWeight?: string };
} | null): Pick<NavbarCompany, "brandNameFontFamily" | "brandNameFontWeight"> {
  return {
    brandNameFontFamily: company?.navbarSettings?.brandNameFontFamily,
    brandNameFontWeight: company?.navbarSettings?.brandNameFontWeight,
  };
}

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { pathname, search } = useLocation();
  const { totalItems } = useCart();
  const { user: authUser, loading: authLoading, logout: authLogout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const categories = useNavCategories();
  const [navLoading, setNavLoading] = useState(false);
  const [company, setCompany] = useState<NavbarCompany>(() => {
    const cached = getCachedData<{
      logo?: string;
      company?: string;
      phone?: string;
      navbarSettings?: NavbarSettings;
    }>(CACHE_KEYS.COMPANY);
    if (!cached) return { logo: "", company: "", phone: "" };
    return {
      logo: resolveCompanyAssetUrl(cached.logo) || "",
      company: String(cached.company || "").trim(),
      phone: cached.phone || "",
      ...readBrandNameFonts(cached),
    };
  });
  const [navbarSettings, setNavbarSettings] = useState<NavbarSettings>(() =>
    normalizeNavbarSettings(getCachedData<{ navbarSettings?: NavbarSettings }>(CACHE_KEYS.COMPANY)?.navbarSettings)
  );
  const tabsAlign: TabsAlign = navbarSettings.tabsAlign;
  const brandNameStyle = useMemo(
    () => getBrandNameFontStyle(company.brandNameFontFamily, company.brandNameFontWeight),
    [company.brandNameFontFamily, company.brandNameFontWeight]
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Use auth context user so we don't flash "Sign In" on page change when user is logged in
  const user = authUser;

  useEffect(() => {
    const applyCompany = (
      data:
        | {
            logo?: string;
            company?: string;
            phone?: string;
            navbarSettings?: NavbarSettings;
          }
        | null
        | undefined
    ) => {
      if (!data) return;
      setCompany({
        logo: resolveCompanyAssetUrl(data.logo) || "",
        company: String(data.company || "").trim(),
        phone: data.phone || "",
        ...readBrandNameFonts(data),
      });
      setNavbarSettings(normalizeNavbarSettings(data.navbarSettings));
    };

    // Instant paint from cache, then always refresh from API (shared with LandingRoute)
    applyCompany(getCachedData(CACHE_KEYS.COMPANY));
    void fetchCompanyShared()
      .then((data) => applyCompany(data || getCachedData(CACHE_KEYS.COMPANY)))
      .catch(() => {
        applyCompany(getCachedData(CACHE_KEYS.COMPANY));
      });

    const onCompanyUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) applyCompany(detail);
    };
    window.addEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated as EventListener);
    return () => {
      window.removeEventListener(COMPANY_UPDATED_EVENT, onCompanyUpdated as EventListener);
    };
  }, []);

  // Process avatar URL from user (auth context or getMe response) for production
  const processAvatarUrl = (avatar: string | undefined) => {
    if (!avatar) return undefined;
    const urls = (import.meta.env.VITE_API_URLS || "").split(",").map((url: string) => url.trim()).filter(Boolean);
    const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const API_BASE_URL = isLocalhost ? urls[0] : (urls[1] || urls[0] || import.meta.env.VITE_API_URL || "");
    const apiBaseWithoutApi = API_BASE_URL ? API_BASE_URL.replace("/api", "") : "";
    if (avatar.includes("localhost") || avatar.includes("127.0.0.1")) {
      const urlPath = avatar.replace(/^https?:\/\/[^/]+/, "");
      return `${apiBaseWithoutApi}${urlPath.startsWith("/") ? urlPath : "/" + urlPath}`;
    }
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    return `${apiBaseWithoutApi}${avatar.startsWith("/") ? avatar : "/" + avatar}`;
  };

  // Initial avatar from auth user (so profile shows immediately on navigation)
  const initialAvatarUrl = useMemo(() => processAvatarUrl(user?.avatar), [user?.avatar]);

  // When user is logged in, optionally fetch fresh avatar from API (runs in background)
  useEffect(() => {
    if (!user) {
      setAvatarUrl(undefined);
      return;
    }
    setAvatarUrl(initialAvatarUrl ?? undefined);
    const token = localStorage.getItem("token");
    if (!token) return;
    getMe(token)
      .then((userData) => {
        if (userData?.user?.avatar) {
          setAvatarUrl(processAvatarUrl(userData.user.avatar) ?? undefined);
        }
      })
      .catch(() => { });
  }, [user, initialAvatarUrl]);

  const refreshWishlistCount = async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }
    try {
      const wishlist = await getUserWishlist();
      setWishlistCount(Array.isArray(wishlist) ? wishlist.length : 0);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    setCategoriesDropdownOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    const onWishlistUpdated = () => {
      refreshWishlistCount();
    };
    window.addEventListener("wishlist-updated", onWishlistUpdated);
    return () => window.removeEventListener("wishlist-updated", onWishlistUpdated);
  }, [user]);

  const linkClasses = (path: string, active?: boolean) => {
    const base = "text-sm transition-colors";
    const isActive = active !== undefined ? active : pathname === path;
    const color = isActive ? "font-medium underline underline-offset-4" : "";

    return `${base} ${color}`;
  };

  const hireMeHref = buildWhatsAppUrl(company.phone, "Hello, I visited the ZI_Core site. I would like to ask you");

  const navLinksProps = {
    settings: navbarSettings,
    categories,
    pathname,
    search,
    categoriesDropdownOpen,
    setCategoriesDropdownOpen,
    linkClasses,
  };

  return (
    <>
      <AnnouncementBar />
      <header
        className="bg-white text-black shadow-sm fixed w-full z-50 transition-[top] duration-300 ease-in-out"
        style={{ top: "var(--announcement-bar-height, 0px)" }}
      >
      <div
        className={`max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between relative ${
          tabsAlign === "center" ? "" : ""
        }`}
      >
        {tabsAlign === "left" ? (
          <div className="flex items-center gap-6 lg:gap-10 min-w-0">
            {/* LEFT: Logo + Nav */}
            <Link
              to="/"
              className="text-xl flex items-center gap-2 shrink-0"
              style={{ color: "var(--theme-primary)", cursor: "pointer", ...brandNameStyle }}
            >
              {company.logo && (
                <img
                  src={company.logo}
                  alt="Logo"
                  className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="text-base sm:text-xl" style={brandNameStyle}>{company.company}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <ShopNavLinks {...navLinksProps} />
            </nav>
          </div>
        ) : (
          <>
        {/* LEFT: Logo */}
        <Link
          to="/"
          className="text-xl flex items-center gap-2 shrink-0"
          style={{ color: "var(--theme-primary)", cursor: "pointer", ...brandNameStyle }}
        >
          {company.logo && (
            <img
              src={company.logo}
              alt="Logo"
              className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-base sm:text-xl" style={brandNameStyle}>{company.company}</span>
        </Link>

        {/* CENTER or (with right) inline nav */}
        <nav
          className={`hidden md:flex items-center gap-8 ${
            tabsAlign === "center"
              ? "absolute left-1/2 -translate-x-1/2"
              : tabsAlign === "right"
                ? "ml-auto mr-4"
                : ""
          }`}
        >
          <ShopNavLinks {...navLinksProps} />
        </nav>
          </>
        )}

        {/* RIGHT: Cart + Sign In + Mobile Menu */}
        <div className={`flex items-center gap-4 shrink-0 ${tabsAlign === "right" ? "" : ""}`}>
          {/* <a
            href={hireMeHref}
            target={hireMeHref !== "#" ? "_blank" : undefined}
            rel={hireMeHref !== "#" ? "noopener noreferrer" : undefined}
            className="hidden md:inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            Hire Me
          </a> */}
          {/* Wishlist icon */}
          <button
            type="button"
            onClick={() => setWishlistOpen(true)}
            className="relative"
            aria-label="Open wishlist"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>
          <WishlistSidebar
            open={wishlistOpen}
            onOpenChange={setWishlistOpen}
            onCountChange={setWishlistCount}
          />
          {/* Cart icon (always visible) */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1rem] h-4 px-0.5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
          {/* Theme toggle button */}
          {/* <button
  onClick={toggleTheme}
  className="p-2 rounded-lg bg-white  text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
  title="Toggle Theme"
>
  {theme === "light" ? "🌙" : "☀️"}
</button> */}


          {/* Sign In (desktop only) */}
          {/* <div className="hidden md:block">
            <Button className="border text-gray-700 bg-white  hover:bg-gray-100" onClick={() => navigate("/login")} >
              Sign In
            </Button>
          </div> */}
          <div className="hidden md:block">
            {authLoading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" aria-hidden />
            ) : !user ? (
              <Button
                className="border text-white"
                style={{
                  backgroundColor: "var(--theme-primary)",
                  borderColor: "var(--theme-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--theme-dark)";
                  e.currentTarget.style.borderColor = "var(--theme-dark)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--theme-primary)";
                  e.currentTarget.style.borderColor = "var(--theme-primary)";
                }}
                onClick={async () => {
                  if (navLoading) return;
                  setNavLoading(true);
                  try {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    navigate("/login");
                  } finally {
                    setNavLoading(false);
                  }
                }}
                loading={navLoading}
              >
                Sign In
              </Button>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 overflow-hidden"
                  title="Profile"
                  style={{ cursor: "pointer" }}
                >
                  {avatarUrl ? (
                    <img
                      key={avatarUrl}
                      src={avatarUrl}
                      alt={user?.name || "User"}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error("Navbar - Avatar image failed to load:", {
                          attemptedUrl: target.src,
                          userAvatar: user?.avatar
                        });
                        // Fallback to initials if image fails
                        target.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log("Navbar - Avatar image loaded successfully:", avatarUrl);
                      }}
                    />
                  ) : (
                    <span className="text-gray-800 font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded shadow-lg z-50">
                    <div className="p-4 text-black border-b">
                      <p className="font-semibold">{user.name}</p>
                      <p
                        className="text-sm text-gray-500 truncate"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-black"
                      style={{ cursor: "pointer" }}
                    >
                      <User size={16} /> Profile
                    </button>
                    <button
                      onClick={() => {
                        authLogout();
                        setDropdownOpen(false);
                        navigate("/login");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-500"
                      style={{ cursor: "pointer" }}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>

            )}
          </div>


          {/* Hamburger menu (mobile only) - Using AppSidebar component */}
          <div className="md:hidden text-black">
            <Button
              type="button"
              onClick={() => setOpen(!open)}
              className="p-2 bg-gray-100 text-black hover:bg-gray-100 focus:outline-none focus:ring-0 border-0"
            >
              <Menu className="w-6 h-6 text-black" />
            </Button>
            <AppSidebar
              open={open}
              onOpenChange={setOpen}
              user={user}
              company={company}
              navLoading={navLoading}
              navbarSettings={navbarSettings}
              onLogout={() => {
                authLogout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
