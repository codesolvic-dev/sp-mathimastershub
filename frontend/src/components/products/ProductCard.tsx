import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { addToWishlist, removeFromWishlist, getUserWishlist } from "@/api/user.api";
import { useToast } from "@/components/ui/toast";
import CircularLoader from "@/components/ui/CircularLoader";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { applyProductDiscount, hasProductDiscount } from "@/utils/productDiscount";
import { useProductCardStyle } from "@/context/ProductCardStyleContext";
import { metaPixel } from "@/utils/metaPixel";

type Props = {
  id: string | number;
  name: string;
  price: number | string;
  image?: string;
  offer?: string;
  discount?: number;
  isInWishlist?: boolean;
  onRemove?: () => void;
  showHeartAlways?: boolean;
  views?: number;
  skipWishlist?: boolean;
  /** Force a style for demos (overrides global setting). */
  forceStyle?: "1" | "2";
};

export default function ProductCard({
  id,
  name,
  price,
  image,
  offer,
  discount,
  isInWishlist: initialIsInWishlist,
  onRemove,
  showHeartAlways = false,
  views = 0,
  skipWishlist = false,
  forceStyle,
}: Props) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const { formatMoney } = useStoreCurrency();
  const { productCardStyle } = useProductCardStyle();
  const style = forceStyle || productCardStyle;
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist || false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (skipWishlist) return;
    const checkWishlistStatus = async () => {
      const token = localStorage.getItem("token");
      if (!user || !token) {
        setIsInWishlist(false);
        return;
      }
      try {
        const wishlist = await getUserWishlist();
        const productId = String(id);
        const isInList =
          Array.isArray(wishlist) &&
          wishlist.some(
            (item: any) =>
              item._id === productId ||
              item.product?._id === productId ||
              item === productId ||
              String(item) === productId
          );
        setIsInWishlist(isInList);
      } catch {
        setIsInWishlist(false);
      }
    };
    checkWishlistStatus();
  }, [id, user, skipWishlist]);

  const numericPrice =
    typeof price === "string" ? parseFloat(price.replace(/[^0-9.]/g, "")) : Number(price);
  const discountPercent = hasProductDiscount(discount)
    ? Number(discount)
    : offer
      ? parseFloat(String(offer).replace(/[^0-9.]/g, ""))
      : 0;
  const showDiscount = hasProductDiscount(discountPercent);
  const originalPrice = numericPrice;
  const discountedPrice = showDiscount
    ? applyProductDiscount(numericPrice, discountPercent)
    : numericPrice;

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      error("Please login to add items to wishlist");
      return;
    }

    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(String(id));
        setIsInWishlist(false);
        success("Removed from wishlist");
        onRemove?.();
      } else {
        await addToWishlist(String(id));
        setIsInWishlist(true);
        success("Added to wishlist");
        metaPixel.wishlist({
          id: String(id),
          name,
          price: Number(price) || undefined,
        });
      }
      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        error(err.message || "Failed to update wishlist");
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const wishlistBtn = (
    <button
      onClick={handleWishlistToggle}
      disabled={wishlistLoading}
      className={`absolute top-3 right-3 transition-all duration-300 z-10 ${
        showHeartAlways ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      } ${wishlistLoading ? "cursor-not-allowed" : ""}`}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      {wishlistLoading ? (
        <div className="w-6 h-6 flex items-center justify-center bg-white/80 rounded-full p-1">
          <CircularLoader size={16} color="var(--theme-primary)" />
        </div>
      ) : (
        <Heart
          size={style === "2" ? 20 : 24}
          className={isInWishlist ? "fill-current" : ""}
          strokeWidth={2.5}
          style={{
            color: isInWishlist ? "var(--theme-primary)" : style === "2" ? "#374151" : "white",
            fill: isInWishlist ? "var(--theme-primary)" : "transparent",
            filter: style === "2" ? undefined : "drop-shadow(0 1px 2px rgba(0,0,0,.4))",
          }}
        />
      )}
    </button>
  );

  const CardContent =
    style === "2" ? (
      <article className="flex flex-col bg-white text-black h-full relative group">
        <div className="relative w-full aspect-square shrink-0 overflow-hidden bg-gray-100">
          <img
            src={image?.trim() ? image : "/product.png"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
          />
          {showDiscount && (
            <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 leading-none">
              {discountPercent}% off
            </span>
          )}
          {wishlistBtn}
        </div>

        <div className="pt-3 pb-1 px-1 flex flex-col items-center text-center shrink-0">
          <h3 className="text-[16px] text-gray-800 mb-1.5 line-clamp-2 leading-snug font-normal">
            {name}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            {showDiscount ? (
              <>
                <span className="text-[16px] font-medium text-red-600 whitespace-nowrap">
                  {formatMoney(discountedPrice)}
                </span>
                <span className="text-[16px] text-gray-400 line-through whitespace-nowrap">
                  {formatMoney(originalPrice)}
                </span>
              </>
            ) : (
              <span className="text-[16px] text-gray-600 font-medium whitespace-nowrap">
                {formatMoney(numericPrice)}
              </span>
            )}
          </div>
        </div>
      </article>
    ) : (
      <article className="flex flex-col bg-slate-100 text-black rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 h-full relative group">
        <div className="relative w-full aspect-square sm:aspect-[4/5] shrink-0">
          <div className="relative w-full h-full bg-gray-200 overflow-hidden rounded-t-lg group">
            <img
              src={image?.trim() ? image : "/product.png"}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
            {showDiscount && (
              <span
                className="absolute top-3 left-3 z-10 text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-sm leading-none"
                style={{ backgroundColor: "var(--theme-primary, #8B5E3C)" }}
              >
                {discountPercent}% off
              </span>
            )}
            {wishlistBtn}
          </div>
        </div>

        <div className="px-0 py-0 sm:px-4 sm:py-2 flex flex-col bg-white rounded-b-lg relative shrink-0 min-h-[4.5rem] sm:min-h-0">
          <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 line-clamp-2 leading-snug">
            {name}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex flex-wrap items-center gap-x-2 min-w-0">
              {showDiscount ? (
                <>
                  <span className="text-sm sm:text-base font-semibold theme-text-primary whitespace-nowrap">
                    {formatMoney(discountedPrice)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400 line-through whitespace-nowrap">
                    {formatMoney(originalPrice)}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base font-semibold theme-text-primary">
                  {formatMoney(numericPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    );

  return (
    <Link
      to={id ? `/product/${id}` : "#"}
      className="block h-full w-full"
      style={{ cursor: "pointer" }}
    >
      {CardContent}
    </Link>
  );
}
