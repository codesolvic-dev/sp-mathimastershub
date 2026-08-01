import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TwoColumnLayout from "@/components/ui/TwoColumnLayout";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/products/CartContext";
import Banner from "@/components/hero/Banner";
import { getBanners, type Banner as BannerType, SHOP_MAIN_BANNER_ASPECT } from "@/api/banner.api";
import { spacing } from "@/utils/spacing";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { getCompany } from "@/api/company.api";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { getOrderAcceptance } from "@/utils/orderAcceptance";


const CartPage = () => {
    const navigate = useNavigate();
    const { formatMoney } = useStoreCurrency();
    const [shopBanner, setShopBanner] = useState<BannerType | null>(null);
    const [acceptOrders, setAcceptOrders] = useState(true);
    const [ordersPausedMessage, setOrdersPausedMessage] = useState("");
const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

  // Load shop banner
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await getBanners();
        const banner = data.find((b) => b.slot === "shop-main");
        setShopBanner(banner || null);
      } catch (err) {
        console.error("Failed to load banner for Cart page", err);
      }
    };
    fetchBanner();
  }, []);

  useEffect(() => {
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
  }, []);
const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

// Calculate subtotal from original prices (item.price is original price)
const subtotal = cartItems.reduce((sum, item) => {
  const itemPrice = Number(item.price) || 0;
  return sum + (itemPrice * item.quantity);
}, 0);

// Calculate total discount amount
const discount = cartItems.reduce((sum, item) => {
  const itemPrice = Number(item.price) || 0;
  const itemDiscount = Number(item.discount) || 0;
  if (itemDiscount === 0) return sum;
  const itemSubtotal = itemPrice * item.quantity;
  return sum + ((itemDiscount / 100) * itemSubtotal);
}, 0);

const total = subtotal - discount;



  const leftContent = (
    <div className="space-y-4">
  {cartItems.map((item) => {
    // item.price is the original price, item.discount is the discount percentage
    const itemPrice = Number(item.price) || 0;
    const itemDiscount = Number(item.discount) || 0;
    const itemSubtotal = itemPrice * item.quantity;
    const itemDiscountAmount = itemDiscount > 0 
      ? (itemDiscount / 100) * itemSubtotal 
      : 0;
    const itemFinalPrice = itemPrice - (itemDiscount > 0 ? (itemDiscount / 100) * itemPrice : 0);
    const itemTotal = itemSubtotal - itemDiscountAmount;
    
    return (
    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-white text-black rounded-xl shadow-sm border">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <img src={item.image || "/product.png"} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold theme-heading text-sm sm:text-base truncate">{item.name}</h3>
          {(item.selectedColor || item.selectedSize || item.selectedCustomValue) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.selectedColor && (
                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  Color: {item.selectedColor}
                </span>
              )}
              {item.selectedSize && (
                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  Size: {item.selectedSize}
                </span>
              )}
              {item.selectedCustomValue && (
                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                  {item.selectedCustomName || "Custom"}: {item.selectedCustomValue}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {itemDiscount > 0 ? (
              <>
                <span className="text-xs sm:text-sm text-gray-500 line-through">{formatMoney(itemPrice)}</span>
                <span className="text-base sm:text-lg font-bold">{formatMoney(itemFinalPrice)}</span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold">{formatMoney(itemPrice)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => decreaseQuantity(item.id)} className="text-black w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition text-sm sm:text-base">−</button>
          <span className="text-black text-base sm:text-lg w-8 text-center">{item.quantity}</span>
          <button onClick={() => increaseQuantity(item.id)} className="text-black w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition text-sm sm:text-base">+</button>
        </div>

        <button onClick={() => removeFromCart(item.id)} className="p-1.5 sm:p-1 text-red-500 hover:bg-red-100 rounded-full transition">
          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  )})}
</div>
  );

const rightContent = (
  <div className="p-4 sm:p-6 bg-white text-black rounded-xl shadow-sm border">
    <h2 className="font-semibold mb-4 text-base sm:text-lg theme-heading">Order Summary</h2>

    <div className="space-y-3 text-gray-700 text-sm">
      <div className="flex justify-between">
        <span>Items</span>
        <span className="font-medium">{totalItems}</span>
      </div>

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span className="font-medium">{formatMoney(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span className="font-medium">-{formatMoney(discount)}</span>
        </div>
      )}

      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
        <span className="text-gray-900">Total</span>
        <span className="text-gray-900">{formatMoney(total)}</span>
      </div>
    </div>

    <button
      onClick={() => {
        if (!acceptOrders) return;
        navigate("/checkout");
      }}
      disabled={!acceptOrders}
      className="mt-6 w-full text-white py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
      {acceptOrders ? "Go to Checkout →" : "Orders temporarily paused"}
    </button>
    {!acceptOrders && ordersPausedMessage ? (
      <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        {ordersPausedMessage}
      </p>
    ) : null}
  </div>
);


  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1`}>
        {/* Purchase List Section */}
        <section className={`w-full ${spacing.section.gap}`}>
          <div className="max-w-[1232px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className={spacing.container.paddingXLarge}>
              <h2 className="text-2xl font-bold mb-6 theme-heading">Purchase List</h2>
              <TwoColumnLayout left={leftContent} right={rightContent} />
            </div>
          </div>
        </section>

        {/* Shop Banner Section */}
        {/* {shopBanner && (
          <section className={`w-full ${spacing.section.gap}`}>
            <div className="max-w-[1232px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <div className={spacing.container.paddingXLarge}>
                <Banner imageSrc={shopBanner.imageUrl} aspectRatio={SHOP_MAIN_BANNER_ASPECT} />
              </div>
            </div>
          </section>
        )} */}
      </main>
      <section className={`w-full ${spacing.footer.gapTop}`} style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Footer />
      </section>
    </div>
  );
};

export default CartPage;
