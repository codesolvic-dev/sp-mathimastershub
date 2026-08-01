import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, ShoppingBag, BookOpen, User, LogOut, X, ChevronDown, Tags } from "lucide-react";
import Button from "./ui/buttons/Button";
import { useNavigate } from "react-router-dom";
import { useNavCategories, getShopCategoryHref } from "@/hooks/useNavCategories";
import {
  DEFAULT_NAVBAR_SETTINGS,
  categoryIdFromSlot,
  isCategorySlot,
  normalizeNavbarSettings,
  normalizeNavItemOrder,
  navItemVisibilityKey,
  resolveNavbarCategories,
  type NavItemKey,
  type NavbarSettings,
} from "@/utils/navbarSettings";

interface AppSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  user?: any;
  company?: { company: string };
  navLoading?: boolean;
  navbarSettings?: Partial<NavbarSettings> | null;
  onLogout?: () => void;
}

export function AppSidebar({
  open,
  onOpenChange,
  user,
  company,
  navLoading,
  navbarSettings: navbarSettingsProp,
  onLogout,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const [slideIn, setSlideIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categories = useNavCategories();
  const settings = normalizeNavbarSettings(navbarSettingsProp ?? DEFAULT_NAVBAR_SETTINGS);
  const navCategories = resolveNavbarCategories(categories, settings.navCategoryIds);

  useEffect(() => {
    if (!open) setCategoriesOpen(false);
  }, [open]);

  // Open: start off-screen (right), then next frame slide in
  useEffect(() => {
    if (open) {
      setSlideIn(false);
      setIsClosing(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setSlideIn(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange?.(false);
      setIsClosing(false);
    }, 400);
  };

  if (!open && !isClosing) return null;

  return (
    <>
      <div
        role="presentation"
        aria-hidden
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
        style={{
          opacity: open || isClosing ? 1 : 0,
          pointerEvents: open && !isClosing ? "auto" : "none",
        }}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-label="Navigation menu"
        className="fixed top-0 right-0 z-50 h-full w-64 max-w-[85vw] bg-white text-black shadow-xl flex flex-col p-6"
        style={{
          transform: slideIn && !isClosing ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded p-1 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <nav className="flex flex-col gap-4 mt-8">
          {normalizeNavItemOrder(settings.navItemOrder).map((item) => {
            const isInline = settings.categoryMenuStyle === "inline";

            if (isCategorySlot(item)) {
              if (!isInline || !navCategories.length) return null;
              const catId = categoryIdFromSlot(item);
              const cat = navCategories.find((c) => String(c._id) === catId);
              if (!cat) return null;
              return (
                <Link
                  key={`cat-${cat._id}`}
                  to={getShopCategoryHref(cat.name)}
                  onClick={() => onOpenChange?.(false)}
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
                >
                  <Tags className="w-5 h-5" />
                  <span>{cat.name}</span>
                </Link>
              );
            }

            if (item !== "categories" && !settings[navItemVisibilityKey(item as NavItemKey)]) {
              return null;
            }

            if (item === "home") {
              return (
                <Link
                  key="home"
                  to="/"
                  onClick={() => onOpenChange?.(false)}
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
              );
            }

            if (item === "products") {
              return (
                <Link
                  key="products"
                  to="/shop"
                  onClick={() => onOpenChange?.(false)}
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Shop</span>
                </Link>
              );
            }

            if (item === "categories") {
              if (isInline) {
                if (normalizeNavItemOrder(settings.navItemOrder).some(isCategorySlot)) {
                  return null;
                }
                return (
                  <React.Fragment key="categories-inline">
                    {navCategories.map((cat) => (
                      <Link
                        key={cat._id}
                        to={getShopCategoryHref(cat.name)}
                        onClick={() => onOpenChange?.(false)}
                        className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
                      >
                        <Tags className="w-5 h-5" />
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </React.Fragment>
                );
              }

              if (!settings.showCategories) return null;

              return (
                <div key="categories" className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((open) => !open)}
                    className="flex items-center justify-between gap-3 text-gray-700 hover:text-gray-900 py-2 w-full text-left"
                    aria-expanded={categoriesOpen}
                  >
                    <span className="flex items-center gap-3">
                      <Tags className="w-5 h-5" />
                      <span>Categories</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {categoriesOpen ? (
                    <div className="pl-8 flex flex-col gap-1 pb-1">
                      {navCategories.length === 0 ? (
                        <span className="text-sm text-gray-500 py-1">No categories yet</span>
                      ) : (
                        navCategories.map((cat) => (
                          <Link
                            key={cat._id}
                            to={getShopCategoryHref(cat.name)}
                            onClick={() => onOpenChange?.(false)}
                            className="text-sm text-gray-600 hover:text-gray-900 py-1.5 border-l border-gray-200 pl-3"
                          >
                            {cat.name}
                          </Link>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            }

            if (item === "blogs") {
              return (
                <Link
                  key="blogs"
                  to="/blogs"
                  onClick={() => onOpenChange?.(false)}
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>{settings.blogsLabel?.trim() || "Blogs"}</span>
                </Link>
              );
            }

            return (
              <Link
                key="about"
                to="/about-us"
                onClick={() => onOpenChange?.(false)}
                className="flex items-center gap-3 text-gray-700 hover:text-gray-900 py-2"
              >
                <User className="w-5 h-5" />
                <span>{settings.aboutLabel?.trim() || "About Us"}</span>
              </Link>
            );
          })}
        </nav>
        {user ? (
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button
              className="w-full justify-start bg-transparent text-gray-800 hover:bg-gray-100"
              onClick={() => {
                onOpenChange?.(false);
                navigate("/profile");
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              className="w-full justify-start bg-transparent text-red-600 hover:bg-red-50"
              disabled={navLoading}
              onClick={() => {
                onOpenChange?.(false);
                if (onLogout) onLogout();
                else navigate("/login");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="mt-auto pt-4">
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange?.(false);
                navigate("/login");
              }}
            >
              Sign In
            </Button>
          </div>
        )}
        {company?.company ? (
          <p className="text-xs text-gray-400 mt-4 text-center">{company.company}</p>
        ) : null}
      </div>
    </>
  );
}
