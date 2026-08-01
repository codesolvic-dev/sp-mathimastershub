// pages/shop/Shop.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ProductGrid from "../../components/products/ProductGrid";
import Banner from "@/components/hero/Banner";
import DynamicButton from "@/components/ui/buttons/DynamicButton";
import EcomTrustBar from "@/components/ecom/EcomTrustBar";
import { EcomBlogFeedSection } from "@/landings/tertiary/EcomLandingSections";
import { getProducts } from "@/api/product.api";
import { getBanners, type Banner as BannerType, SHOP_MAIN_BANNER_ASPECT } from "@/api/banner.api";
import { getCategories } from "@/api/category.api";
import PageLoader from "@/components/ui/PageLoader";
import Pagination from "@/components/ui/Pagination";
import { Search, X } from "lucide-react";

import { spacing } from "@/utils/spacing";
import { metaPixel } from "@/utils/metaPixel";

// API product type
interface ApiProduct {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  category?: { _id?: string; name: string } | string;
  description?: string;
  currency?: string;
  views?: number;
}

// Frontend Product type for display
interface Product {
  id: string;
  name: string;
  price: number;
  discount?: number;
  image: string;
  categoryName: string;
  categoryId?: string;
  description?: string;
  currency?: string;
  views?: number;
}

function normalizeCategoryKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function productMatchesCategory(
  product: Product,
  selectedCategory: string
): boolean {
  const selected = selectedCategory.trim();
  if (!selected) return true;
  if (product.categoryId && product.categoryId === selected) return true;
  const selectedKey = normalizeCategoryKey(selected);
  const nameKey = normalizeCategoryKey(product.categoryName);
  return Boolean(nameKey) && nameKey === selectedKey;
}

interface Category {
  _id: string;
  name: string;
  icon?: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [shopBanner, setShopBanner] = useState<BannerType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Products per page: 20 products = 4 rows (5 products per row on large screen)
  const PRODUCTS_PER_PAGE = 20;

  /** ~half mobile horizontal padding vs former px-3 + px-8 stack; desktop unchanged */
  const SHOP_SECTION_WRAP = "max-w-8xl mx-auto px-5 sm:px-8 md:px-10 lg:px-14";

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selectedCategory = params.get("category"); // category from query



  
  useEffect(() => {
    fetchProducts();
    fetchBanners();
    fetchCategories();
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedCategory) return;
    // Wait until pixel is ready (bootstrap/tracker may still be loading)
    const fire = () => {
      if (!window.__spMetaPixelReady) return false;
      const match = categories.find(
        (c) =>
          c.name === selectedCategory ||
          normalizeCategoryKey(c.name) === normalizeCategoryKey(selectedCategory)
      );
      metaPixel.categoryView({
        id: match?._id,
        name: selectedCategory,
      });
      return true;
    };
    if (fire()) return;
    const t = window.setInterval(() => {
      if (fire()) window.clearInterval(t);
    }, 200);
    const stop = window.setTimeout(() => window.clearInterval(t), 4000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, [selectedCategory, categories]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    const t = window.setTimeout(() => {
      metaPixel.search(q);
    }, 600);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res: ApiProduct[] = await getProducts({ activeOnly: true }); // API returns array
      const activeOnly = res.filter(
        (p) => String((p as ApiProduct & { status?: string }).status || "active").toLowerCase() !== "inactive"
      );

      // map API product to frontend Product type
   const mapped: Product[] = activeOnly.map((p) => {
  const cat = p.category;
  const categoryName =
    typeof cat === "string" ? "" : cat?.name || "Category";
  const categoryId =
    typeof cat === "string" ? cat : cat?._id ? String(cat._id) : undefined;
  return {
  id: p._id,
  name: p.name,
  price: p.price,
  discount: p.discount,
  image: [p.image1, p.image2, p.image3, p.image4, p.image5, p.image6].find(
  (img) => img && img.trim() !== "" && img !== "/product.png"
) || "/product.png",

  categoryName: categoryName || "Category",
  categoryId,
  description: p.description,
  currency: p.currency,
  views: p.views,
};
});

      // Store all products
      setAllProducts(mapped);

      if (selectedCategory) {
        // only show products of selected category
        setProducts(mapped.filter((p) => productMatchesCategory(p, selectedCategory)));
      } else {
        // show all products
        setProducts(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories({ activeOnly: true });
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // Load banner that appears at the top of the Shop page
  const fetchBanners = async () => {
    try {
      const data = await getBanners();
      const banner = data.find((b) => b.slot === "shop-main");
      setShopBanner(banner || null);
    } catch (err) {
      console.error("Failed to load banners for Shop page", err);
    }
  };

  // Filter by search query (case-insensitive, matches name)
  const filteredProducts = searchQuery.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : products;

  // Calculate pagination on filtered results
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const displayedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of allProducts) {
      map.set(product.categoryName, (map.get(product.categoryName) ?? 0) + 1);
    }
    return map;
  }, [allProducts]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      navigate("/shop");
      return;
    }
    navigate(`/shop?category=${encodeURIComponent(value)}`);
  };

  return (
    <div className="bg-white text-black min-h-screen flex flex-col w-full max-w-full sp-ecom-page">
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1 w-full max-w-full overflow-x-hidden`}>
        {/* Shop banner */}
        {/* <section className={spacing.section.gap}>
          <div className={SHOP_SECTION_WRAP}>
            <Banner imageSrc={shopBanner?.imageUrl || "/hero.png"} aspectRatio={SHOP_MAIN_BANNER_ASPECT} />
          </div>
        </section> */}

        {/* Category dropdown + Search */}
        <section>
          <div className={SHOP_SECTION_WRAP}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-4">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="shop-category" className="sr-only">
                  Category
                </label>
                <select
                  id="shop-category"
                  value={selectedCategory ?? ""}
                  onChange={handleCategoryChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                >
                  <option value="">All ({allProducts.length})</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name} ({categoryCounts.get(category.name) ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-64 sm:shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-full border border-gray-300 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': 'var(--theme-primary)' } as React.CSSProperties}
                />
                {searchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className={spacing.section.gap}>
          <div className={SHOP_SECTION_WRAP}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${spacing.inner.gapBottom}`}>
              <h2 className="text-2xl font-bold theme-heading m-0 p-0">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedCategory || "All Products"}
              </h2>
              <span className="text-sm text-gray-500">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>

          {loading && !initialLoad ? (
            <PageLoader />
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">
                No products found{searchQuery ? ` for "${searchQuery}"` : ""}
              </p>
              {searchQuery && (
                <button
                  onClick={handleSearchClear}
                  className="mt-3 text-sm font-medium underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <ProductGrid items={displayedProducts} />
              
              {/* Pagination */}
              {products.length > PRODUCTS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={products.length}
                  itemsPerPage={PRODUCTS_PER_PAGE}
                />
              )}
            </>
          )}
          </div>
        </section>

        {/* Trust bar — full page width (same as product detail & blog) */}
        {/* <EcomTrustBar asSection contentPage="tertiary-product" className="max-w-none" /> */}

        {/* Blog feed — same as home page */}
        <EcomBlogFeedSection containerClassName={SHOP_SECTION_WRAP} />
      </main>
      <section className={`w-full ${spacing.footer.gapTop}`} style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Footer />
      </section>
    </div>
  );
};

export default Shop;
