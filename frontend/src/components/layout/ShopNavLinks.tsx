import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { getShopCategoryHref } from "@/hooks/useNavCategories";
import {
  categoryIdFromSlot,
  isCategorySlot,
  normalizeNavItemOrder,
  navItemVisibilityKey,
  resolveNavbarCategories,
  type NavItemKey,
  type NavbarSettings,
} from "@/utils/navbarSettings";
import { metaPixel } from "@/utils/metaPixel";

export type NavCategory = { _id: string; name: string };

type ShopNavLinksProps = {
  settings: NavbarSettings;
  categories: NavCategory[];
  pathname: string;
  search: string;
  categoriesDropdownOpen: boolean;
  setCategoriesDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  linkClasses: (path: string, active?: boolean) => string;
};

export default function ShopNavLinks({
  settings,
  categories,
  pathname,
  search,
  categoriesDropdownOpen,
  setCategoriesDropdownOpen,
  linkClasses,
}: ShopNavLinksProps) {
  const isShopPage = pathname === "/shop";
  const selectedCategory = new URLSearchParams(search).get("category");
  const isCategoriesNavActive = isShopPage && Boolean(selectedCategory);
  const inactive = "var(--theme-dark)";
  const active = "var(--theme-primary)";
  const order = normalizeNavItemOrder(settings.navItemOrder);
  const navCategories = resolveNavbarCategories(categories, settings.navCategoryIds);
  const categoryById = new Map(categories.map((c) => [String(c._id), c]));
  const isInline = settings.categoryMenuStyle === "inline";
  // Inline: show selected category links whenever any are chosen (even if "Categories" row unchecked)
  const showInlineCategories =
    isInline &&
    navCategories.length > 0 &&
    (settings.showCategories || normalizeNavCategoryIdsHasSelection(settings.navCategoryIds));

  const renderDropdown = () => {
    if (!settings.showCategories) return null;
    return (
      <div
        className="relative"
        onMouseEnter={() => setCategoriesDropdownOpen(true)}
        onMouseLeave={() => setCategoriesDropdownOpen(false)}
      >
        <button
          type="button"
          className={`text-sm transition-colors flex items-center gap-1 pb-0.5 border-b-2 border-transparent ${
            isCategoriesNavActive ? "font-medium underline underline-offset-4 border-transparent" : ""
          }`}
          style={{
            color: isCategoriesNavActive ? active : inactive,
            cursor: "pointer",
          }}
          onClick={() => setCategoriesDropdownOpen((open) => !open)}
          aria-expanded={categoriesDropdownOpen}
          aria-haspopup="true"
        >
          Categories
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${categoriesDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
        {categoriesDropdownOpen ? (
          <div className="absolute top-full left-0 mt-1 py-2 min-w-[200px] max-w-[260px] max-h-[70vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {navCategories.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No categories yet</div>
            ) : (
              navCategories.map((cat) => (
                <Link
                  key={cat._id}
                  to={getShopCategoryHref(cat.name)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 truncate"
                  style={{
                    color: isShopPage && selectedCategory === cat.name ? active : undefined,
                    fontWeight: isShopPage && selectedCategory === cat.name ? 600 : undefined,
                  }}
                  onClick={() => {
                    metaPixel.categoryView({ id: String(cat._id), name: cat.name });
                    setCategoriesDropdownOpen(false);
                  }}
                >
                  {cat.name}
                </Link>
              ))
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const renderInlineCategory = (catId: string) => {
    if (!showInlineCategories) return null;
    const cat = categoryById.get(catId) || navCategories.find((c) => String(c._id) === catId);
    if (!cat) return null;
    if (!navCategories.some((c) => String(c._id) === catId)) return null;
    const isActive = isShopPage && selectedCategory === cat.name;
    return (
      <Link
        key={`cat-${cat._id}`}
        to={getShopCategoryHref(cat.name)}
        className={linkClasses("/shop", isActive)}
        style={{ color: isActive ? active : inactive, cursor: "pointer" }}
        onClick={() => metaPixel.categoryView({ id: String(cat._id), name: cat.name })}
      >
        {cat.name}
      </Link>
    );
  };

  return (
    <>
      {order.map((item) => {
        if (isCategorySlot(item)) {
          if (!isInline) return null;
          const id = categoryIdFromSlot(item);
          return renderInlineCategory(id);
        }

        if (item !== "categories" && !settings[navItemVisibilityKey(item as NavItemKey)]) {
          return null;
        }

        switch (item) {
          case "home":
            return (
              <Link
                key="home"
                to="/"
                className={linkClasses("/")}
                style={{ color: pathname === "/" ? active : inactive, cursor: "pointer" }}
              >
                Home
              </Link>
            );
          case "products":
            return (
              <Link
                key="products"
                to="/shop"
                className={linkClasses("/shop", isShopPage && !selectedCategory)}
                style={{
                  color: isShopPage && !selectedCategory ? active : inactive,
                  cursor: "pointer",
                }}
              >
                Products
              </Link>
            );
          case "categories":
            if (isInline) {
              // Prefer explicit category: slots; this marker is a fallback only
              if (order.some(isCategorySlot)) return null;
              if (!showInlineCategories) return null;
              return (
                <React.Fragment key="categories-inline">
                  {navCategories.map((cat) => renderInlineCategory(String(cat._id)))}
                </React.Fragment>
              );
            }
            return <React.Fragment key="categories">{renderDropdown()}</React.Fragment>;
          case "blogs":
            return (
              <Link
                key="blogs"
                to="/blogs"
                className={linkClasses("/blogs")}
                style={{
                  color: pathname.startsWith("/blog") ? active : inactive,
                  cursor: "pointer",
                }}
              >
                {settings.blogsLabel?.trim() || "Blogs"}
              </Link>
            );
          case "about":
            return (
              <Link
                key="about"
                to="/about-us"
                className={linkClasses("/about-us")}
                style={{
                  color: pathname === "/about-us" ? active : inactive,
                  cursor: "pointer",
                }}
              >
                {settings.aboutLabel?.trim() || "About Us"}
              </Link>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

function normalizeNavCategoryIdsHasSelection(raw: string[] | undefined): boolean {
  if (!raw || !raw.length) return true; // empty = all categories
  if (raw.length === 1 && raw[0] === "__none__") return false;
  return raw.some((id) => id && id !== "__none__");
}
