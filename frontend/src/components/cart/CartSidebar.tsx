import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/products/CartContext";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { getCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { getOrderAcceptance } from "@/utils/orderAcceptance";

type CartSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CartSidebar({ open, onOpenChange }: CartSidebarProps) {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();
  const { formatMoney } = useStoreCurrency();
  const [slideIn, setSlideIn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [acceptOrders, setAcceptOrders] = useState(true);
  const [ordersPausedMessage, setOrdersPausedMessage] = useState("");

  useEffect(() => {
    if (open) {
      setSlideIn(false);
      setIsClosing(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setSlideIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setSlideIn(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const apply = (company: any) => {
      const { acceptOrders: ok, ordersPausedMessage: msg } = getOrderAcceptance(
        company?.paymentSettings
      );
      setAcceptOrders(ok);
      setOrdersPausedMessage(msg);
    };
    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached) apply(cached);
    getCompany()
      .then(apply)
      .catch(() => {});
  }, [open]);

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

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    return sum + itemPrice * item.quantity;
  }, 0);

  const discount = cartItems.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemDiscount = Number(item.discount) || 0;
    if (itemDiscount === 0) return sum;
    return sum + (itemDiscount / 100) * itemPrice * item.quantity;
  }, 0);

  const total = subtotal - discount;

  const goToCart = () => {
    handleClose();
    setTimeout(() => navigate("/cart"), 150);
  };

  const goToCheckout = () => {
    if (!acceptOrders) return;
    handleClose();
    setTimeout(() => navigate("/checkout"), 150);
  };

  if (!open && !isClosing) return null;

  const sidebarContent = (
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
        aria-label="Shopping cart"
        className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white text-gray-900 shadow-xl flex flex-col"
        style={{
          transform: slideIn && !isClosing ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold theme-heading">Your cart</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const itemPrice = Number(item.price) || 0;
                const itemDiscount = Number(item.discount) || 0;
                const itemSubtotal = itemPrice * item.quantity;
                const itemDiscountAmount =
                  itemDiscount > 0 ? (itemDiscount / 100) * itemSubtotal : 0;
                const itemTotal = itemSubtotal - itemDiscountAmount;
                const itemFinalPrice =
                  itemPrice - (itemDiscount > 0 ? (itemDiscount / 100) * itemPrice : 0);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <img
                      src={item.image || "/product.png"}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {(item.selectedColor || item.selectedSize || item.selectedCustomValue) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedColor && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {item.selectedSize}
                            </span>
                          )}
                          {item.selectedCustomValue && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {item.selectedCustomName || "Custom"}: {item.selectedCustomValue}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
                          >
                            −
                          </button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-sm"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          {itemDiscount > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-400 line-through">
                                {formatMoney(itemSubtotal)}
                              </span>
                              <span className="text-sm font-semibold">{formatMoney(itemTotal)}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold">
                              {formatMoney(itemFinalPrice * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 bg-gray-50 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goToCart}
                className="w-full py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-white transition-colors"
              >
                View cart
              </button>
              <button
                type="button"
                onClick={goToCheckout}
                disabled={!acceptOrders}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: acceptOrders ? "var(--theme-primary)" : "#9ca3af",
                }}
                onMouseEnter={(e) => {
                  if (!acceptOrders) return;
                  e.currentTarget.style.backgroundColor = "var(--theme-dark)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = acceptOrders
                    ? "var(--theme-primary)"
                    : "#9ca3af";
                }}
              >
                {acceptOrders ? "Checkout" : "Paused"}
              </button>
            </div>
            {!acceptOrders && ordersPausedMessage ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {ordersPausedMessage}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return sidebarContent;
  }

  return createPortal(sidebarContent, document.body);
}
