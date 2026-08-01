import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Heart,
  ShoppingBag,
  Eye,
  Share2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { addToWishlist, removeFromWishlist, getUserWishlist } from "@/api/user.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { spacing } from "@/utils/spacing";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import AddToCartButton from "@/components/ui/buttons/AddToCartButton";
import SocialShare from "@/components/products/SocialShare";
import ProductGrid from "@/components/products/ProductGrid";
import ProductDetailTabs from "@/components/products/ProductDetailTabs";
import ProductDetailAccordion from "@/components/products/ProductDetailAccordion";
import ExpandableClampText from "@/components/products/ExpandableClampText";
import ProductDeliveryInfo from "@/components/products/ProductDeliveryInfo";
import EcomTrustBar from "@/components/ecom/EcomTrustBar";
import { EcomReviewsSupportSection, EcomBlogFeedSection } from "@/landings/tertiary/EcomLandingSections";
import { useEcomProductDetailSections } from "@/hooks/useEcomProductDetailSections";
import { useLandingSectionContentMap } from "@/hooks/useLandingSectionContentMap";
import { useProductDetailStyle } from "@/context/ProductDetailStyleContext";
import { metaPixel } from "@/utils/metaPixel";
import { ECOM_REVIEWS_SUPPORT_SECTION_ID } from "@/landings/tertiary/ecomReviewsSupport";
import { ECOM_SECTION_INNER, ECOM_PRODUCTS_PER_ROW } from "@/landings/tertiary/constants";
import { getProduct, getProducts, incrementProductView } from "@/api/product.api";
import { getCompany } from "@/api/company.api";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { useCart } from "@/components/products/CartContext";
import { applyProductDiscount, hasProductDiscount } from "@/utils/productDiscount";

/* =======================
   Types
======================= */
interface Product {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  description?: string;
  images?: string[];
  category?: any;
  categoryName?: string;
  metaFeatures?: string;
  metaInfo?: string;
  video1?: string;
  video2?: string;
  stock?: number;
  [key: string]: any;
}

/* =======================
   Component
======================= */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { formatMoney, currency: storeCurrency } = useStoreCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  // Guards against double view-count (React StrictMode re-mounts effects in dev)
  const viewCountedRef = useRef<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [companyName, setCompanyName] = useState<string>("Splorem");
  const [paymentSettings, setPaymentSettings] = useState<Record<string, unknown> | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { productDetailStyle } = useProductDetailStyle();
  const isStyle2 = productDetailStyle === "2";
  const detailWidgetSections = useEcomProductDetailSections();
  const { contentMap: detailSectionContentMap } = useLandingSectionContentMap("tertiary-product");
  const productReviewsSupportContentMap = useMemo(() => {
    const section = detailSectionContentMap[ECOM_REVIEWS_SUPPORT_SECTION_ID] ?? {};
    return {
      ...detailSectionContentMap,
      [ECOM_REVIEWS_SUPPORT_SECTION_ID]: {
        ...section,
        supportTitle: "Support Team",
        supportMembers: "Rose, Misha, Ashi",
      },
    };
  }, [detailSectionContentMap]);
  const { cartItems } = useCart();

  const isInCart = product
    ? cartItems.some(
        (item) =>
          item.productId === product._id ||
          item.id === product._id ||
          String(item.id).startsWith(String(product._id))
      )
    : false;

  // Variations States
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedCustomValue, setSelectedCustomValue] = useState<string>("");
  const [activeVariant, setActiveVariant] = useState<any>(null);

  // Variations Helpers
  const getCssColor = (colorName: string): string => {
    const name = colorName.trim().toLowerCase().replace(/\s+/g, "");
    const colorMap: Record<string, string> = {
      navy: "#000080",
      peach: "#ffdab9",
      beige: "#f5f5dc",
      khaki: "#f0e68c",
      burgundy: "#800020",
      maroon: "#800000",
      mint: "#98ff98",
      charcoal: "#36454f",
      cream: "#fffdd0",
      mustard: "#ffdb58",
      lavender: "#e6e6fa",
      coral: "#ff7f50",
      olive: "#808000",
      gold: "#ffd700",
      silver: "#c0c0c0",
      bronze: "#cd7f32",
      tan: "#d2b48c",
      teal: "#008080",
      cyan: "#00ffff",
      magenta: "#ff00ff",
      lime: "#00ff00",
      indigo: "#4b0082",
      violet: "#ee82ee",
      pink: "#ffc0cb",
      rose: "#ff007f",
      apricot: "#fbceb1",
    };
    return colorMap[name] || name;
  };

  const getPriceDisplay = () => {
    if (!product) return formatMoney(0);

    if (product.hasVariations && product.variants && product.variants.length > 0) {
      const prices = product.variants
        .map((v: any) => v.price)
        .filter((p: any) => p !== undefined && p !== null && !isNaN(p));

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        const applyDiscount = (p: number) => applyProductDiscount(p, product.discount);

        const minDisc = applyDiscount(minPrice);
        const maxDisc = applyDiscount(maxPrice);

        if (minDisc !== maxDisc) {
          return `${formatMoney(minDisc)} – ${formatMoney(maxDisc)}`;
        }
        return formatMoney(minDisc);
      }
    }

    return formatMoney(discountedPrice);
  };

  useEffect(() => {
    if (!product) return;
    const colors = product.variationConfig?.colors || [];
    const sizes = product.variationConfig?.sizes || [];
    const customVals = product.variationConfig?.customValues || [];

    const initialColor = colors[0] || "";
    const initialSize = sizes[0] || "";
    const initialCustomVal = customVals[0] || "";

    setSelectedColor(initialColor);
    setSelectedSize(initialSize);
    setSelectedCustomValue(initialCustomVal);
  }, [product]);

  useEffect(() => {
    if (!product || !product.hasVariations || !product.variants) {
      setActiveVariant(null);
      return;
    }

    const match = product.variants.find((v: any) => {
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const customMatch = !selectedCustomValue || v.customValue === selectedCustomValue;
      return colorMatch && sizeMatch && customMatch;
    });

    setActiveVariant(match || null);
  }, [selectedColor, selectedSize, selectedCustomValue, product]);

  const getDisplayImages = () => {
    if (!product) return ["/product.png"];
    const baseImages = product.images || [];
    if (activeVariant?.image) {
      const absoluteVarImage = getAbsoluteImageUrl(activeVariant.image);
      const exists = baseImages.some(img => getAbsoluteImageUrl(img) === absoluteVarImage);
      if (!exists) {
        return [activeVariant.image, ...baseImages];
      } else {
        const filtered = baseImages.filter(img => getAbsoluteImageUrl(img) !== absoluteVarImage);
        return [activeVariant.image, ...filtered];
      }
    }
    return baseImages;
  };

  /* =======================
     Fetch Single Product
  ======================= */
  useEffect(() => {
    if (!id) return;

    // Scroll to top when product changes
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(id);

        const images = [
          data.image1,
          data.image2,
          data.image3,
          data.image4,
          data.image5,
          data.image6,
        ].filter(img =>
          img &&
          img.trim() !== "" &&
          img !== "/product.png" &&
          !img.includes("placeholder") &&
          !img.includes("wqwwwq")
        );

        const categoryName = data.categoryName || data.category?.name || data.category || null;
        setProduct({
          ...data,
          images,
          categoryName: categoryName,
          category: data.category || null,
          name: data.name || "Product",
          metaFeatures: data.metaFeatures || "",
          metaInfo: data.metaInfo || "",
        });
        setShareCount(Number(data.shares) || 0);
        setViewCount(Number(data.views) || 0);

        metaPixel.productView({
          id: String(data._id || id),
          name: data.name || "Product",
          price: Number(data.price) || 0,
          currency: data.currency,
          category: typeof categoryName === "string" ? categoryName : undefined,
        });

        // Count this visit only once per product (StrictMode-safe)
        if (viewCountedRef.current !== id) {
          viewCountedRef.current = id;
          const updatedViews = await incrementProductView(id);
          if (updatedViews != null) setViewCount(updatedViews);
          else setViewCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("PRODUCT FETCH ERROR:", err);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchProduct();
  }, [id]);

  /* =======================
     Fetch All Products
  ======================= */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const products = await getProducts({ activeOnly: true });
        const mapped = products.map((p: any) => ({
          ...p,
          images: [
            p.image1,
            p.image2,
            p.image3,
          ].filter(Boolean),
          categoryName: p.category?.name,
        }));
        setAllProducts(mapped);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
  }, []);

  /* =======================
     Fetch Company Name and Logo
  ======================= */
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await getCompany();
        if (data?.company) {
          setCompanyName(data.company);
        }
        if (data?.logo) {
          setCompanyLogoUrl(data.logo);
        }
        if (data?.paymentSettings) {
          setPaymentSettings(data.paymentSettings);
        }
      } catch (err) {
        console.error("Failed to load company:", err);
      }
    };

    fetchCompany();
  }, []);

  /* =======================
     Helper: Get Absolute Image URL
  ======================= */
  const getAbsoluteImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl === "/product.png" || imageUrl.trim() === "") {
      // Return absolute URL for default product image
      return `${window.location.origin}/product.png`;
    }

    // If already absolute URL (from API mapImages function), return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // If relative URL, make it absolute using API URL
    const apiUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || window.location.origin;
    if (imageUrl.startsWith("/")) {
      return `${apiUrl}${imageUrl}`;
    }

    // If relative path without leading slash
    return `${apiUrl}/${imageUrl}`;
  };

  /* =======================
     Helper: Clean Description for Meta Tags
  ======================= */
  const cleanDescription = (desc: string | undefined, productName: string): string => {
    if (!desc) return `${productName} - Available at ${companyName}`;

    // Remove HTML tags and decode HTML entities
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = desc;
    let text = tempDiv.textContent || tempDiv.innerText || "";

    // Trim and limit length (OG description should be max 200 chars)
    text = text.trim().replace(/\s+/g, " ");
    if (text.length > 200) {
      text = text.substring(0, 197) + "...";
    }

    return text || `${productName} - Available at ${companyName}`;
  };

  // Set meta tags in document head (must be before early return to follow Rules of Hooks)
  useEffect(() => {
    if (!product) return;

    // Prefer product image for link previews (fallback: company logo)
    const imageToUse = product.images?.[0] || companyLogoUrl;
    const ogImageUrl = getAbsoluteImageUrl(imageToUse);
    const ogDescription = cleanDescription(product.description, product.name);
    const pageTitle = `${product.name} | ${companyName}`;

    // Set meta tags directly in document head as fallback for crawlers
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      if (!content || content.trim() === "") {
        return;
      }

      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Set all OG tags directly
    setMetaTag("og:title", `${product.name} | ${companyName}`);
    setMetaTag("og:description", ogDescription);
    setMetaTag("og:image", ogImageUrl);
    setMetaTag("og:image:secure_url", ogImageUrl);
    setMetaTag("og:image:width", "1200");
    setMetaTag("og:image:height", "630");
    setMetaTag("og:image:alt", product.name || companyName);
    setMetaTag("og:url", window.location.href);
    setMetaTag("og:type", "product");
    setMetaTag("og:site_name", companyName);
    setMetaTag("product:price:amount", product.price.toString());
    setMetaTag("product:price:currency", storeCurrency);

    // Set Twitter tags
    setMetaTag("twitter:card", "summary_large_image", false);
    setMetaTag("twitter:title", `${product.name} | ${companyName}`, false);
    setMetaTag("twitter:description", ogDescription, false);
    setMetaTag("twitter:image", ogImageUrl, false);
    setMetaTag("twitter:image:alt", product.name || companyName, false);

    // Set description
    setMetaTag("description", ogDescription, false);

    // Set title
    document.title = pageTitle;
  }, [product, companyName, companyLogoUrl, storeCurrency]);

  /* =======================
     Derived Data
  ======================= */
  const currentPrice = activeVariant ? activeVariant.price : (product?.price || 0);
  const discountedPrice = applyProductDiscount(currentPrice, product?.discount);

  const isOutOfStock = product?.hasVariations
    ? (activeVariant ? activeVariant.stock <= 0 : false)
    : (product?.stock !== undefined ? product.stock <= 0 : false);

  const similarProducts = product && allProducts.length > 0
    ? allProducts
      .filter((p) => p._id !== product._id)
      .slice(0, ECOM_PRODUCTS_PER_ROW)
    : [];

  const similarProductGridItems = similarProducts.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    image: p.images?.[0],
    discount: hasProductDiscount(p.discount) ? p.discount : undefined,
  }));

  if (!product) {
    return (
      <div className="bg-white text-black min-h-screen flex flex-col w-full max-w-full sp-ecom-page">
        <Navbar />
        <main className={`${spacing.navbar.offset} flex-1 w-full`}>
          <div className="max-w-8xl mx-auto px-4 py-16 text-center text-gray-500 text-sm">
            {loading || initialLoad ? "Loading product…" : "Product not found"}
          </div>
        </main>
      </div>
    );
  }

  // Prefer product image for share / OG previews (fallback: company logo)
  const imageForMeta = product?.images?.[0] || companyLogoUrl;
  const metaImageUrl = product ? getAbsoluteImageUrl(imageForMeta) : "";
  const metaDescription = product ? cleanDescription(product.description, product.name) : "";
  const metaTitle = product ? `${product.name} | ${companyName}` : companyName;

  // Wishlist Button Component
  const WishlistButtonComponent = ({ productId }: { productId: string }) => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
      // Check if product is in wishlist
      const checkWishlistStatus = async () => {
        // Check both user and token to prevent unnecessary API calls
        const token = localStorage.getItem("token");
        if (!user || !token) {
          setIsInWishlist(false);
          return;
        }
        try {
          const wishlist = await getUserWishlist();
          const isInList = Array.isArray(wishlist) && wishlist.some((item: any) =>
            item._id === productId || item.product?._id === productId || item === productId
          );
          setIsInWishlist(isInList);
        } catch (err: any) {
          // Silently handle all errors - getUserWishlist already handles 401s
          setIsInWishlist(false);
        }
      };
      checkWishlistStatus();
    }, [productId, user]);

    const handleWishlistToggle = async () => {
      if (!user) {
        error("Please login to add items to wishlist");
        return;
      }

      if (wishlistLoading) return;

      setWishlistLoading(true);
      try {
        if (isInWishlist) {
          await removeFromWishlist(productId);
          setIsInWishlist(false);
          success("Removed from wishlist");
        } else {
          await addToWishlist(productId);
          setIsInWishlist(true);
          success("Added to wishlist");
          metaPixel.wishlist({
            id: productId,
            name: product?.name,
            price: Number(product?.price) || undefined,
          });
        }
        window.dispatchEvent(new CustomEvent("wishlist-updated"));
      } catch (err: any) {
        // Silently handle 401 errors (user not logged in) - already shown error message above
        if (err?.response?.status !== 401) {
          error(err.message || "Failed to update wishlist");
        }
      } finally {
        setWishlistLoading(false);
      }
    };

    // Show button for all users - will prompt login if not authenticated

    return (
      <button
        type="button"
        onClick={handleWishlistToggle}
        disabled={wishlistLoading}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        className="flex shrink-0 items-center justify-center w-12 h-12 min-w-12 min-h-12 md:min-w-0 md:min-h-0 rounded-lg border-2 box-border transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 md:active:scale-100"
        style={{
          borderColor: "var(--theme-primary)",
          color: "var(--theme-primary)",
          backgroundColor: isInWishlist ? "var(--theme-light)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!wishlistLoading) {
            e.currentTarget.style.backgroundColor = "var(--theme-light)";
          }
        }}
        onMouseLeave={(e) => {
          if (!wishlistLoading) {
            e.currentTarget.style.backgroundColor = isInWishlist ? "var(--theme-light)" : "transparent";
          }
        }}
      >
        {wishlistLoading ? (
          <CircularLoader
            size={20}
            color="var(--theme-primary)"
          />
        ) : (
          <Heart
            className={`w-[22px] h-[22px] md:w-5 md:h-5 ${isInWishlist ? "fill-current" : ""}`}
            strokeWidth={2.25}
            style={{
              color: "var(--theme-primary)",
              fill: isInWishlist ? "var(--theme-primary)" : "transparent",
            }}
          />
        )}
      </button>
    );
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={product ? `${product.name} | ${companyName}` : companyName} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImageUrl} />
        <meta property="og:image:secure_url" content={metaImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={product?.name || companyName || ""} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content={companyName} />
        <meta property="product:price:amount" content={product?.price?.toString() || ""} />
        <meta property="product:price:currency" content={storeCurrency} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product ? `${product.name} | ${companyName}` : companyName} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={metaImageUrl} />
        <meta name="twitter:image:alt" content={product?.name || companyName || ""} />
        {/* Additional meta tags for better compatibility */}
        <meta name="og:image" content={metaImageUrl} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <Navbar />
      <div className="bg-white min-h-screen flex flex-col w-full max-w-full third-landing-page sp-ecom-page">
        <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1 w-full max-w-full overflow-x-hidden`}>
          {/* Section 1: Product image + info */}
          <section className={`w-full ${spacing.section.gap}`}>
            <div className={ECOM_SECTION_INNER}>
                <div className={`grid grid-cols-1 gap-6 md:gap-8 ${isStyle2 ? "md:grid-cols-2" : "md:grid-cols-[1fr_1.5fr] gap-2 md:gap-3"}`}>
                  <div className={`w-full flex justify-start ${isStyle2 ? "" : "-mr-2 md:-mr-3"}`}>
                    <ProductImageGallery
                      images={getDisplayImages()}
                      variant={isStyle2 ? "ecom-bottom" : "ecom"}
                    />
                  </div>

                  {/* Product Info */}
                  <div className={`flex flex-col ${isStyle2 ? "gap-4" : "gap-3"}`}>
                    <h1
                      className={
                        isStyle2
                          ? "text-2xl sm:text-3xl font-semibold text-gray-800 leading-snug"
                          : "text-2xl sm:text-3xl font-bold theme-heading"
                      }
                      style={isStyle2 ? undefined : { color: "var(--theme-primary)" }}
                    >
                      {product.name || "Product Name"}
                    </h1>

                    <div className="flex gap-3 items-baseline flex-wrap">
                      <span
                        className={
                          isStyle2
                            ? "text-2xl sm:text-3xl font-bold whitespace-nowrap text-gray-900"
                            : "text-xl sm:text-2xl font-bold whitespace-nowrap text-gray-900"
                        }
                      >
                        {getPriceDisplay()}
                      </span>
                      {hasProductDiscount(product.discount) && !activeVariant && (
                        <span
                          className={
                            isStyle2
                              ? "line-through text-gray-400 text-lg sm:text-xl whitespace-nowrap"
                              : "line-through text-gray-400 text-lg sm:text-xl whitespace-nowrap"
                          }
                        >
                          {formatMoney(product.price)}
                        </span>
                      )}
                    </div>

                    {isStyle2 && product.description ? (
                      <ExpandableClampText
                        text={product.description}
                        lines={8}
                        className="text-[15px] sm:text-base text-gray-500"
                        buttonClassName="text-[var(--theme-primary)]"
                      />
                    ) : null}

                    {!product.hasVariations && !isStyle2 && (
                      <div className="text-sm font-medium">
                        {(product.stock ?? 0) > 0 ? (
                          <span className="text-green-600">
                            Availability: <span className="font-bold">{product.stock} in stock</span>
                          </span>
                        ) : (
                          <span className="text-red-600">Availability: Out of Stock</span>
                        )}
                      </div>
                    )}

                    {/* Product Variations Selectors */}
                    {product.hasVariations && (
                      <div className="border-t border-b py-4 my-2 space-y-4">
                        {/* Color Selector */}
                        {product.variationConfig?.colors && product.variationConfig.colors.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                              Color: <span className="text-gray-900 font-bold">{selectedColor || "Select Color"}</span>
                            </span>
                            <div className="flex flex-wrap gap-3 items-center">
                              {product.variationConfig.colors.map((color: string) => {
                                const cssColor = getCssColor(color);
                                const isSelected = selectedColor === color;
                                const isLightColor = ["white", "cream", "yellow", "lightgray", "silver", "#ffffff", "#fff"].includes(color.trim().toLowerCase());
                                return (
                                  <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full border relative transition-all duration-200 flex items-center justify-center hover:scale-110 shadow-sm ${isSelected ? "ring-2 ring-offset-2 ring-gray-400 border-transparent" : "border-gray-300"
                                      }`}
                                    style={{
                                      backgroundColor: cssColor,
                                    }}
                                    title={color}
                                  >
                                    {isSelected && (
                                      <span className={`text-xs font-bold leading-none ${isLightColor ? "text-gray-900" : "text-white"}`}>
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Size Selector */}
                        {product.variationConfig?.sizes && product.variationConfig.sizes.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                              Size: <span className="text-gray-900 font-bold">{selectedSize || "Select Size"}</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {product.variationConfig.sizes.map((size: string) => {
                                const isSelected = selectedSize === size;
                                return (
                                  <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className="px-4 py-2 text-sm rounded-full border transition-all font-semibold shadow-sm"
                                    style={{
                                      borderColor: isSelected ? "var(--theme-primary)" : "#E5E5E5",
                                      backgroundColor: isSelected ? "white" : "#F9FAFB",
                                      color: isSelected ? "black" : "#6B7280",
                                      borderWidth: isSelected ? "2px" : "1px",
                                    }}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Custom Variation Selector */}
                        {product.variationConfig?.customName && product.variationConfig.customValues && product.variationConfig.customValues.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                              {product.variationConfig.customName}: <span className="text-gray-900 font-bold">{selectedCustomValue || `Select ${product.variationConfig.customName}`}</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {product.variationConfig.customValues.map((val: string) => {
                                const isSelected = selectedCustomValue === val;
                                return (
                                  <button
                                    key={val}
                                    onClick={() => setSelectedCustomValue(val)}
                                    className="px-4 py-2 text-sm rounded-lg border transition-all font-semibold shadow-sm"
                                    style={{
                                      borderColor: isSelected ? "var(--theme-primary)" : "#E5E5E5",
                                      backgroundColor: isSelected ? "white" : "#F9FAFB",
                                      color: isSelected ? "black" : "#6B7280",
                                      borderWidth: isSelected ? "2px" : "1px",
                                    }}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Clear Button */}
                        {(selectedColor || selectedSize || selectedCustomValue) && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                setSelectedColor("");
                                setSelectedSize("");
                                setSelectedCustomValue("");
                              }}
                              className="text-xs uppercase tracking-wider font-bold text-gray-500 hover:text-red-600 transition-colors underline"
                            >
                              Clear Selection
                            </button>
                          </div>
                        )}

                        {/* Stock Availability Info */}
                        {activeVariant && (
                          <div className="space-y-2 mt-4 pt-2 border-t">
                            <div className="text-xl font-bold text-gray-900">
                              {formatMoney(applyProductDiscount(activeVariant.price, product.discount))}
                              {hasProductDiscount(product.discount) && (
                                <span className="line-through text-gray-400 text-sm ml-2 font-normal">
                                  {formatMoney(activeVariant.price)}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium">
                              {activeVariant.stock > 0 ? (
                                <span className="text-green-600">Availability: <span className="font-bold">{activeVariant.stock} in stock</span></span>
                              ) : (
                                <span className="text-red-600">Availability: Out of Stock</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`flex flex-row items-center gap-3 sm:gap-4 w-full ${isStyle2 ? "" : "md:w-auto"}`}>
                      {isOutOfStock ? (
                        <button
                          disabled
                          className="flex-1 min-w-0 w-full px-8 text-gray-500 font-semibold h-12 rounded-lg bg-gray-200 cursor-not-allowed flex items-center justify-center"
                        >
                          Out of Stock
                        </button>
                      ) : (
                        <>
                          <div className={isStyle2 ? "flex-1 min-w-0" : "flex-1 min-w-0 md:contents"}>
                            <AddToCartButton
                              product={{
                                id: product.hasVariations
                                  ? `${product._id}_${[selectedColor, selectedSize, selectedCustomValue].filter(Boolean).join("_")}`
                                  : product._id,
                                productId: product._id,
                                name: product.hasVariations && [selectedColor, selectedSize, selectedCustomValue].filter(Boolean).length > 0
                                  ? `${product.name} (${[selectedColor, selectedSize, selectedCustomValue].filter(Boolean).join(" / ")})`
                                  : product.name,
                                price: activeVariant ? activeVariant.price : product.price,
                                discount: hasProductDiscount(product.discount) ? product.discount : undefined,
                                image: activeVariant?.image || product.images?.[0],
                                selectedColor: selectedColor || undefined,
                                selectedSize: selectedSize || undefined,
                                selectedCustomValue: selectedCustomValue || undefined,
                                selectedCustomName: product.variationConfig?.customName || undefined,
                              }}
                              onAdded={() => { }}
                              variant={isStyle2 ? "dark" : "primary"}
                              fullWidth={isStyle2}
                              hideIcon={isStyle2}
                            />
                          </div>
                          {isStyle2 ? (
                            <div className="flex-1 min-w-0">
                              <AddToCartButton
                                product={{
                                  id: product.hasVariations
                                    ? `${product._id}_${[selectedColor, selectedSize, selectedCustomValue].filter(Boolean).join("_")}`
                                    : product._id,
                                  productId: product._id,
                                  name: product.hasVariations && [selectedColor, selectedSize, selectedCustomValue].filter(Boolean).length > 0
                                    ? `${product.name} (${[selectedColor, selectedSize, selectedCustomValue].filter(Boolean).join(" / ")})`
                                    : product.name,
                                  price: activeVariant ? activeVariant.price : product.price,
                                  discount: hasProductDiscount(product.discount) ? product.discount : undefined,
                                  image: activeVariant?.image || product.images?.[0],
                                  selectedColor: selectedColor || undefined,
                                  selectedSize: selectedSize || undefined,
                                  selectedCustomValue: selectedCustomValue || undefined,
                                  selectedCustomName: product.variationConfig?.customName || undefined,
                                }}
                                variant="green"
                                label="Buy It Now"
                                hideIcon
                                fullWidth
                                checkoutAfterAdd
                              />
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>

                    {!isStyle2 ? (
                      <>
                        <ProductDeliveryInfo
                          paymentSettings={paymentSettings}
                          formatMoney={formatMoney}
                          className="mt-2"
                        />

                        <SocialShare
                          productName={product.name}
                          productUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/product/${product._id}`}
                          companyName={companyName}
                          productImage={getAbsoluteImageUrl(
                            getDisplayImages()[0] || product.images?.[0] || companyLogoUrl
                          )}
                          productDescription={product.description}
                          productId={product._id}
                          onShared={() => setShareCount((prev) => prev + 1)}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
          </section>

          {/* Section 2: Description tabs / accordion */}
          <section className={`w-full ${spacing.section.gap}`}>
            <div className={ECOM_SECTION_INNER}>
              {isStyle2 ? (
                <ProductDetailAccordion
                  description={product.description}
                  specificationsHtml={product.metaFeatures || product.metaInfo}
                  videoUrl={product.video1}
                  videoUrl2={product.video2}
                />
              ) : (
                <ProductDetailTabs
                  description={product.description}
                  returnsHtml={product.metaFeatures}
                  careHtml={product.metaInfo}
                  videoUrl={product.video1}
                  videoUrl2={product.video2}
                />
              )}
            </div>
          </section>

          {/* Sp eCom widgets — order from Developer → Sp eCom → Product Details builder */}
          {detailWidgetSections.map((sectionId) => {
            if (sectionId === "ecom-trust-bar") {
              return (
                <EcomTrustBar key={sectionId} asSection contentPage="tertiary-product" />
              );
            }
            if (sectionId === "ecom-similar-products") {
              return (
                <section key={sectionId} className={`w-full ${spacing.section.gap}`}>
                  <div className={ECOM_SECTION_INNER}>
                    <h3
                      className={
                        isStyle2
                          ? "text-2xl font-bold text-gray-900 text-center"
                          : "text-2xl font-bold theme-heading"
                      }
                      style={isStyle2 ? undefined : { color: "var(--theme-primary)" }}
                    >
                      {isStyle2 ? "You may also like" : "Similar Products"}
                    </h3>

                    <div className={spacing.inner.gapTop}>
                      <ProductGrid items={similarProductGridItems} limit={ECOM_PRODUCTS_PER_ROW} />
                    </div>
                  </div>
                </section>
              );
            }
            if (sectionId === "ecom-reviews-support") {
              return (
                <EcomReviewsSupportSection
                  key={sectionId}
                  contentMap={productReviewsSupportContentMap}
                  reviewPreset={{
                    productId: product._id,
                    productName: product.name,
                  }}
                />
              );
            }
            if (sectionId === "ecom-blog-feed") {
              return <EcomBlogFeedSection key={sectionId} />;
            }
            return null;
          })}
        </main>
        <section className={`w-full ${spacing.footer.gapTop}`} style={{ marginBottom: 0, paddingBottom: 0 }}>
          <Footer />
        </section>
      </div>
    </>
  );
}
