import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/components/products/CartContext";
import CircularLoader from "@/components/ui/CircularLoader";
import { ShoppingCart, CheckCircle } from "lucide-react";

type CartProduct = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  discount?: number;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedCustomValue?: string;
  selectedCustomName?: string;
};

type Props = {
  product: CartProduct;
  onAdded?: () => void;
  /** primary = theme; dark = charcoal; green = fixed green (Buy It Now) */
  variant?: "primary" | "dark" | "green";
  /** Stretch to full width of parent */
  fullWidth?: boolean;
  hideIcon?: boolean;
  label?: string;
  /** After add, go to checkout (Buy It Now) */
  checkoutAfterAdd?: boolean;
  className?: string;
};

function Snackbar({ visible, productName }: { visible: boolean; productName: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "80px"})`,
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        zIndex: 9999,
        pointerEvents: "none",
        minWidth: "260px",
        maxWidth: "90vw",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        <CheckCircle size={18} style={{ color: "#4ade80", flexShrink: 0 }} />
        <span>
          <strong style={{ fontWeight: 700 }}>
            {productName.length > 30 ? productName.slice(0, 30) + "…" : productName}
          </strong>{" "}
          added to cart!
        </span>
      </div>
    </div>
  );
}

export default function AddToCartButton({
  product,
  onAdded,
  variant = "primary",
  fullWidth = false,
  hideIcon = false,
  label = "Add to Cart",
  checkoutAfterAdd = false,
  className = "",
}: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { addToCart } = useCart();

  const isDark = variant === "dark";
  const isGreen = variant === "green";
  const bg = isDark ? "#1f2937" : isGreen ? "#16a34a" : "var(--theme-primary)";
  const bgHover = isDark ? "#111827" : isGreen ? "#15803d" : "var(--theme-dark)";

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    addToCart({ ...product, quantity: 1 });

    await new Promise((res) => setTimeout(res, checkoutAfterAdd ? 200 : 500));

    setLoading(false);
    onAdded?.();

    if (checkoutAfterAdd) {
      navigate("/checkout");
      return;
    }

    setSnackbarVisible(true);
    setTimeout(() => setSnackbarVisible(false), 3000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${fullWidth ? "w-full" : "w-full md:w-auto"} px-8 text-white font-semibold h-12 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        } ${className}`}
        style={{
          backgroundColor: bg,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = bgHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.backgroundColor = bg;
          }
        }}
      >
        {loading ? (
          <>
            <CircularLoader size={20} color="white" />
            Processing...
          </>
        ) : (
          <>
            {!hideIcon ? <ShoppingCart size={18} /> : null}
            {label}
          </>
        )}
      </button>

      <Snackbar visible={snackbarVisible} productName={product.name} />
    </>
  );
}
