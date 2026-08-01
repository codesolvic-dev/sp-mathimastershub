import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Heart, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserWishlist, removeFromWishlist } from "@/api/user.api";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { useToast } from "@/components/ui/toast";
import { resolveCompanyAssetUrl } from "@/utils/companyBrand";

type WishlistSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (count: number) => void;
};

function getProductImage(product: any): string {
  return (
    product?.image1 ||
    product?.image2 ||
    product?.image3 ||
    product?.image4 ||
    product?.image5 ||
    product?.image6 ||
    product?.image ||
    "/product.png"
  );
}

export default function WishlistSidebar({
  open,
  onOpenChange,
  onCountChange,
}: WishlistSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatMoney } = useStoreCurrency();
  const { success, error } = useToast();
  const [slideIn, setSlideIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      onCountChange?.(0);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserWishlist();
      const valid = Array.isArray(data)
        ? data.filter((p) => p && (p._id || p.productId?._id))
        : [];
      setItems(valid);
      onCountChange?.(valid.length);
    } catch {
      setItems([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [user, onCountChange]);

  useEffect(() => {
    if (open) {
      loadWishlist();
      setSlideIn(false);
      setIsClosing(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setSlideIn(false);
  }, [open, loadWishlist]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsClosing(false);
    }, 400);
  };

  const handleRemove = async (productId: string) => {
    if (removingId) return;
    setRemovingId(productId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => {
        const next = prev.filter((item) => {
          const id = item?._id || item?.productId?._id;
          return id !== productId;
        });
        onCountChange?.(next.length);
        return next;
      });
      success("Removed from wishlist");
      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch (err: any) {
      error(err?.message || "Failed to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  const goToProduct = (productId: string) => {
    handleClose();
    setTimeout(() => navigate(`/product/${productId}`), 150);
  };

  const goToLogin = () => {
    handleClose();
    setTimeout(() => navigate("/login"), 150);
  };

  if (!open && !isClosing) return null;

  return (
    <>
      <div
        role="presentation"
        aria-hidden
        className="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300"
        style={{
          opacity: open || isClosing ? 1 : 0,
          pointerEvents: open && !isClosing ? "auto" : "none",
        }}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-label="Wishlist"
        className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white text-gray-900 shadow-xl flex flex-col"
        style={{
          transform: slideIn && !isClosing ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold theme-heading">Wishlist</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 hover:bg-gray-100"
            aria-label="Close wishlist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Heart className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Sign in to see your wishlist</p>
              <button
                type="button"
                onClick={goToLogin}
                className="mt-4 px-5 py-2.5 rounded-md text-white text-sm font-medium theme-button"
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
              Loading wishlist...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Heart className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Your wishlist is empty</p>
              <p className="text-sm text-gray-400 mt-1">Save products you love</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const product = item?.productId || item;
                const productId = product?._id;
                if (!productId) return null;
                const image = resolveCompanyAssetUrl(getProductImage(product)) || getProductImage(product);
                const discount = Number(product.discount) || 0;
                const price = Number(product.price) || 0;
                const finalPrice =
                  discount > 0 ? price - (discount / 100) * price : price;

                return (
                  <div
                    key={productId}
                    className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => goToProduct(productId)}
                      className="shrink-0"
                    >
                      <img
                        src={image}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => goToProduct(productId)}
                          className="text-sm font-semibold text-gray-900 line-clamp-2 text-left hover:underline"
                        >
                          {product.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(productId)}
                          disabled={removingId === productId}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full shrink-0 disabled:opacity-50"
                          aria-label={`Remove ${product.name} from wishlist`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 text-sm font-medium theme-text-primary">
                        {discount > 0 ? (
                          <span>
                            <span className="text-gray-400 line-through mr-2">
                              {formatMoney(price)}
                            </span>
                            {formatMoney(finalPrice)}
                          </span>
                        ) : (
                          formatMoney(price)
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function notifyWishlistUpdated() {
  window.dispatchEvent(new CustomEvent("wishlist-updated"));
}
