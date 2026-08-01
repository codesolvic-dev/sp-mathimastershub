import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from "@/components/products/CartContext";
import StripeCardForm from "@/components/ui/modals/StripeCardForm";
import { createOrder, updateOrderPaymentStatus } from "@/api/order.api";
import { useToast } from "@/components/ui/toast";
import { getUserAddresses, addUserAddress } from "@/api/user.api";
import { useAuth } from "@/hooks/useAuth";
import { validateCoupon } from "@/api/coupon.api";
import { getEnabledAdminTabs } from "@/api/admintab.api";
import { getCompany } from "@/api/company.api";
import { getCachedData, CACHE_KEYS } from "@/utils/cache";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import ProductDeliveryInfo from "@/components/products/ProductDeliveryInfo";
import {
  deliverySettingsFromPayment,
  getDeliveryCodDisplayAmount,
  getShippingMethodCodLabel,
  getShippingMethodFreeLabel,
} from "@/utils/deliveryInfo";
import {
  formatConfirmationNumber,
  saveOrderConfirmation,
  type OrderConfirmationSnapshot,
} from "@/types/OrderConfirmation";
import { markSelfPlacedOrder } from "@/contexts/NotificationContext";
import { playCustomerSuccessSound } from "@/utils/notificationSound";
import {
  DEFAULT_ORDERS_PAUSED_MESSAGE,
  getOrderAcceptance,
} from "@/utils/orderAcceptance";
import { metaPixel } from "@/utils/metaPixel";

type Address = {
  _id?: string;
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  area?: string;
  postalCode: string;
  phone: string;
  line1: string;
  isDefault?: boolean;
};

export type CheckoutContentProps = {
  layout?: "modal" | "page";
  isActive?: boolean;
  onComplete?: (orderId: string) => void;
};

const inputClass =
  "border border-gray-300 rounded-md px-3 py-2.5 w-full text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent";
const sectionClass = "space-y-4";
const sectionTitleClass = "text-lg font-semibold text-gray-900 theme-heading";

type PaymentMethodId = "card" | "cod" | "bank";

type ShippingMethodId = "cod_delivery" | "free_online";

type PaymentSettings = {
  enableCard: boolean;
  enableCod: boolean;
  enableBankDeposit: boolean;
  acceptOrders?: boolean;
  ordersPausedMessage?: string;
  bankName?: string;
  accountName?: string;
  iban?: string;
  accountNumber?: string;
  whatsappNumber?: string;
  thankYouNote?: string;
  codFee?: number;
  deliveryFee?: number;
  deliveryFreeText?: string;
  deliveryOnlineText?: string;
  deliveryDaysText?: string;
};

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  enableCard: true,
  enableCod: true,
  enableBankDeposit: true,
  acceptOrders: true,
  ordersPausedMessage: DEFAULT_ORDERS_PAUSED_MESSAGE,
};

const CheckoutContent: React.FC<CheckoutContentProps> = ({
  layout = "modal",
  isActive = true,
  onComplete,
}) => {
  const { cartItems, clearCart } = useCart();
  const { success, error } = useToast();
  const { user } = useAuth();
  const { formatMoney, currency: storeCurrency } = useStoreCurrency();
  const isPage = layout === "page";

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponDiscountVal, setCouponDiscountVal] = useState<number>(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponsEnabled, setCouponsEnabled] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card");
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>("free_online");

  const deliverySettings = deliverySettingsFromPayment(paymentSettings);
  const deliveryCodAmount = getDeliveryCodDisplayAmount(deliverySettings);
  const codShippingTotal = deliveryCodAmount;
  const hasOnlinePayment =
    paymentSettings.enableCard || paymentSettings.enableBankDeposit;
  const useShippingMethodPicker = paymentSettings.enableCod && hasOnlinePayment;
  const { acceptOrders, ordersPausedMessage } = getOrderAcceptance(paymentSettings);

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const itemPrice = Number(item.price) || 0;
    return sum + itemPrice * item.quantity;
  }, 0);

  const discount = cartItems.reduce((sum: number, item: any) => {
    const itemPrice = Number(item.price) || 0;
    const itemDiscount = Number(item.discount) || 0;
    if (itemDiscount === 0) return sum;
    const itemSubtotal = itemPrice * item.quantity;
    return sum + (itemDiscount / 100) * itemSubtotal;
  }, 0);

  const total = subtotal - discount;
  const shippingCost = useShippingMethodPicker
    ? shippingMethod === "cod_delivery"
      ? codShippingTotal
      : 0
    : paymentMethod === "cod"
      ? deliveryCodAmount
      : 0;
  const finalTotal = Math.max(0, total - couponDiscountVal + shippingCost);

  const [addressType, setAddressType] = useState<"new" | "existing">("new");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    firstName: "",
    lastName: "",
    province: "",
    city: "",
    area: "",
    postalCode: "",
    phone: "",
    line1: "",
  });
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponDiscountVal(0);
      setCouponError("");
      setCouponSuccess("");
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      getEnabledAdminTabs()
        .then((tabs: any[]) => {
          const isEnabled = tabs.some((tab) => tab.path === "/admin/coupons" && tab.enabled);
          setCouponsEnabled(isEnabled);
        })
        .catch(() => setCouponsEnabled(true));
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const applyPaymentSettings = (company: any) => {
      const settings: PaymentSettings = {
        ...DEFAULT_PAYMENT_SETTINGS,
        ...(company?.paymentSettings || {}),
      };
      setPaymentSettings(settings);

      const hasOnline =
        settings.enableCard || settings.enableBankDeposit;
      if (settings.enableCod && hasOnline) {
        setShippingMethod("free_online");
        setPaymentMethod(settings.enableCard ? "card" : "bank");
      } else {
        const enabled: PaymentMethodId[] = [];
        if (settings.enableCard) enabled.push("card");
        if (settings.enableCod) enabled.push("cod");
        if (settings.enableBankDeposit) enabled.push("bank");
        if (enabled.length > 0) {
          setPaymentMethod((current) =>
            enabled.includes(current) ? current : enabled[0]
          );
        }
      }
    };

    const cached = getCachedData<any>(CACHE_KEYS.COMPANY);
    if (cached?.paymentSettings) {
      applyPaymentSettings(cached);
    }

    getCompany()
      .then(applyPaymentSettings)
      .catch(() => {
        if (!cached?.paymentSettings) {
          setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
        }
      });
  }, [isActive]);

  useEffect(() => {
    if (!useShippingMethodPicker) return;
    if (shippingMethod === "cod_delivery") {
      setPaymentMethod("cod");
    } else if (paymentSettings.enableCard) {
      setPaymentMethod("card");
    } else if (paymentSettings.enableBankDeposit) {
      setPaymentMethod("bank");
    }
  }, [shippingMethod, useShippingMethodPicker, paymentSettings.enableCard, paymentSettings.enableBankDeposit]);

  useEffect(() => {
    if (!isActive || cartItems.length === 0) return;
    metaPixel.beginCheckout({
      value: Number(subtotal) || 0,
      currency: storeCurrency,
      numItems: cartItems.reduce(
        (sum: number, item: any) => sum + (Number(item.quantity) || 1),
        0
      ),
      contentIds: cartItems.map((item: any) => String(item.productId || item.id)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once when checkout becomes active
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !paymentMethod) return;
    metaPixel.addPaymentInfo({
      value: Number(subtotal) || 0,
      currency: storeCurrency,
      paymentMethod,
    });
  }, [isActive, paymentMethod, storeCurrency, subtotal]);

  useEffect(() => {
    if (isActive) {
      const loadAddresses = async () => {
        try {
          const allAddresses: Address[] = [];

          if (user) {
            try {
              const backendAddresses = await getUserAddresses();
              if (backendAddresses && Array.isArray(backendAddresses) && backendAddresses.length > 0) {
                allAddresses.push(...backendAddresses);
              }
            } catch (err) {
              console.warn("Failed to load addresses from backend:", err);
            }
          }

          const savedAddresses = localStorage.getItem("savedAddresses");
          if (savedAddresses) {
            try {
              const parsedAddresses = JSON.parse(savedAddresses);
              if (Array.isArray(parsedAddresses) && parsedAddresses.length > 0) {
                parsedAddresses.forEach((localAddr: Address) => {
                  const exists = allAddresses.some(
                    (addr) =>
                      addr.phone?.trim() === localAddr.phone?.trim() &&
                      addr.line1?.trim() === localAddr.line1?.trim() &&
                      addr.postalCode?.trim() === localAddr.postalCode?.trim()
                  );
                  if (!exists) allAddresses.push(localAddr);
                });
              }
            } catch (err) {
              console.error("Error loading saved addresses:", err);
            }
          }

          if (allAddresses.length > 0) {
            setAddresses(allAddresses);
            setSelectedAddressIndex(0);
            setAddressType("existing");
          }
        } catch (err) {
          console.error("Error loading addresses:", err);
        }
      };
      loadAddresses();
    }
  }, [isActive, user]);

  const saveAddressesToStorage = (addressList: Address[]) => {
    try {
      localStorage.setItem("savedAddresses", JSON.stringify(addressList));
    } catch (err) {
      console.error("Error saving addresses to localStorage:", err);
    }
  };

  const addressExists = (address: Address, addressList: Address[]): boolean => {
    if (!address || !addressList || addressList.length === 0) return false;
    return addressList.some(
      (addr) =>
        addr.phone?.trim() === address.phone?.trim() &&
        addr.line1?.trim() === address.line1?.trim() &&
        addr.postalCode?.trim() === address.postalCode?.trim() &&
        addr.firstName?.trim() === address.firstName?.trim() &&
        addr.lastName?.trim() === address.lastName?.trim()
    );
  };

  const addressToUse =
    addressType === "existing" && selectedAddressIndex !== null
      ? addresses[selectedAddressIndex]
      : newAddress;

  const validateAddress = (): boolean => {
    const errors: Partial<Record<keyof Address, string>> = {};
    if (!newAddress.firstName.trim()) errors.firstName = "First name is required";
    if (!newAddress.lastName.trim()) errors.lastName = "Last name is required";
    if (!newAddress.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(newAddress.phone)) {
      errors.phone = "Phone number must be 10-15 digits";
    }
    if (!newAddress.line1.trim()) errors.line1 = "Address line 1 is required";
    if (!newAddress.city.trim()) errors.city = "City is required";
    if (!newAddress.province.trim()) errors.province = "Province is required";
    if (!newAddress.postalCode.trim()) errors.postalCode = "Postal code is required";
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const result = await validateCoupon({
        code: couponCode.toUpperCase().trim(),
        userId: user?.id,
        cartItems: cartItems.map((item: any) => ({
          productId: item.productId || item.id,
          price: Number(item.price) || 0,
          quantity: item.quantity,
        })),
      });

      const cartTotalBeforeCoupon = subtotal - discount;
      let calculatedDiscount = 0;

      if (result.type === "percentage") {
        calculatedDiscount = (result.amount / 100) * cartTotalBeforeCoupon;
      } else if (result.type === "fixed") {
        calculatedDiscount = Math.min(result.amount, cartTotalBeforeCoupon);
      } else if (result.type === "product_specific") {
        const eligibleSubtotal = cartItems.reduce((sum: number, item: any) => {
          const eligibleIds = result.eligibleProductIds?.map((id: any) => id.toString()) || [];
          const actualProductId = item.productId || item.id;
          if (eligibleIds.includes(actualProductId.toString())) {
            const itemPrice = Number(item.price) || 0;
            const itemDiscount = Number(item.discount) || 0;
            const finalItemPrice = itemPrice - (itemDiscount > 0 ? (itemDiscount / 100) * itemPrice : 0);
            return sum + finalItemPrice * item.quantity;
          }
          return sum;
        }, 0);
        calculatedDiscount = Math.min(result.amount, eligibleSubtotal);
      }

      setAppliedCoupon(result);
      setCouponDiscountVal(calculatedDiscount);
      setCouponSuccess(result.message || "Coupon applied successfully!");
      success("Coupon applied successfully!");
    } catch (err: any) {
      setCouponError(err.response?.data?.message || err.message || "Invalid coupon code");
      error(err.response?.data?.message || err.message || "Invalid coupon code");
      setAppliedCoupon(null);
      setCouponDiscountVal(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponDiscountVal(0);
    setCouponError("");
    setCouponSuccess("");
    success("Coupon removed.");
  };

  const handleAddressSave = async () => {
    if (savingAddress) return;
    if (!validateAddress()) {
      error("Please fill all required fields correctly.");
      return;
    }

    setSavingAddress(true);
    try {
      if (user) {
        try {
          const updatedAddresses = await addUserAddress(newAddress);
          setAddresses(updatedAddresses);
          setSelectedAddressIndex(updatedAddresses.length - 1);
          setAddressType("existing");
          setAddressErrors({});
          setNewAddress({
            firstName: "",
            lastName: "",
            province: "",
            city: "",
            area: "",
            postalCode: "",
            phone: "",
            line1: "",
          });
          success("Address saved successfully!");
          return;
        } catch (err) {
          console.warn("Failed to save address to backend:", err);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedAddresses = [...addresses];
      if (!addressExists(newAddress, updatedAddresses)) {
        updatedAddresses.push(newAddress);
        setAddresses(updatedAddresses);
        setSelectedAddressIndex(updatedAddresses.length - 1);
        saveAddressesToStorage(updatedAddresses);
      } else {
        const existingIndex = updatedAddresses.findIndex(
          (addr) =>
            addr.phone === newAddress.phone &&
            addr.line1 === newAddress.line1 &&
            addr.postalCode === newAddress.postalCode
        );
        setSelectedAddressIndex(existingIndex);
      }

      setAddressType("existing");
      setAddressErrors({});
      setNewAddress({
        firstName: "",
        lastName: "",
        province: "",
        city: "",
        area: "",
        postalCode: "",
        phone: "",
        line1: "",
      });
      success("Address saved successfully!");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setNewAddress((prev) => ({ ...prev, phone: value }));
    }
  };

  const buildConfirmationSnapshot = async (
    order: { _id: string; payment: string; bill: number; orderNumber?: number },
    paymentLabel: string
  ): Promise<OrderConfirmationSnapshot> => {
    const cachedCompany = getCachedData<any>(CACHE_KEYS.COMPANY);
    let company = cachedCompany;
    if (!company) {
      try {
        company = await getCompany();
      } catch {
        company = null;
      }
    }

    return {
      orderId: order._id,
      confirmationNumber: formatConfirmationNumber(order._id, order.orderNumber),
      customerName: `${addressToUse.firstName} ${addressToUse.lastName}`,
      firstName: addressToUse.firstName,
      email: user?.email || company?.email || "",
      payment: paymentLabel,
      bill: order.bill,
      currency: company?.currency || storeCurrency,
      address: {
        firstName: addressToUse.firstName,
        lastName: addressToUse.lastName,
        line1: addressToUse.line1,
        area: addressToUse.area,
        city: addressToUse.city,
        province: addressToUse.province,
        postalCode: addressToUse.postalCode,
        phone: addressToUse.phone,
      },
      items: cartItems.map((item: any) => ({
        productId: String(item.productId || item.id || ""),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        discount: item.discount,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedCustomValue: item.selectedCustomValue,
      })),
      couponCode: appliedCoupon?.code,
      couponDiscount: couponDiscountVal > 0 ? couponDiscountVal : undefined,
      subtotal,
      productDiscount: discount,
      deliveryFee: shippingCost,
      thankYouNote: company?.paymentSettings?.thankYouNote,
    };
  };

  const finishOrder = async (
    order: { _id: string; payment: string; bill: number; orderNumber?: number },
    paymentLabel: string
  ) => {
    markSelfPlacedOrder(order._id);
    if (!addressExists(addressToUse, addresses)) {
      if (user) {
        try {
          const updatedAddresses = await addUserAddress(addressToUse);
          setAddresses(updatedAddresses);
        } catch (err) {
          console.warn("Failed to save address to backend:", err);
          const updatedAddresses = [...addresses];
          updatedAddresses.push(addressToUse);
          setAddresses(updatedAddresses);
          saveAddressesToStorage(updatedAddresses);
        }
      } else {
        const updatedAddresses = [...addresses];
        updatedAddresses.push(addressToUse);
        setAddresses(updatedAddresses);
        saveAddressesToStorage(updatedAddresses);
      }
    }

    const snapshot = await buildConfirmationSnapshot(order, paymentLabel);
    saveOrderConfirmation(snapshot);
    metaPixel.purchase({
      value: Number(order.bill) || 0,
      currency: snapshot.currency || storeCurrency,
      orderId: order._id,
      contentIds: snapshot.items.map((item) => String(item.productId || "")),
      numItems: snapshot.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      contents: snapshot.items.map((item) => ({
        id: String(item.productId || ""),
        quantity: item.quantity || 1,
        item_price: Number(item.price) || 0,
      })),
    });
    playCustomerSuccessSound();
    onComplete?.(order._id);
    clearCart();
  };

  const buildOrderData = (payment: string) => {
    const paymentValue = payment.toLowerCase();
    const paymentMethod =
      paymentValue === "card" || paymentValue.includes("card")
        ? "card"
        : paymentValue === "cod" || paymentValue.includes("cash")
          ? "cod"
          : paymentValue === "bank" || paymentValue.includes("bank") || paymentValue.includes("deposit")
            ? "bank"
            : payment;
    const paymentLabel =
      paymentMethod === "card"
        ? "Card Payment"
        : paymentMethod === "cod"
          ? "Cash on Delivery"
          : paymentMethod === "bank"
            ? "Bank Deposit"
            : payment;

    return {
      customerName: `${addressToUse.firstName} ${addressToUse.lastName}`,
      address: {
        firstName: addressToUse.firstName,
        lastName: addressToUse.lastName,
        line1: addressToUse.line1,
        area: addressToUse.area,
        city: addressToUse.city,
        province: addressToUse.province,
        postalCode: addressToUse.postalCode,
        phone: addressToUse.phone,
      },
      phoneNumber: addressToUse.phone,
      items: cartItems.map((i) => ({
        productId: String(i.productId || i.id || ""),
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        discount: Number(i.discount) || 0,
        image: i.image || "",
      })),
      type: "Online",
      subtotal,
      productDiscount: discount,
      deliveryFee: shippingCost,
      bill: finalTotal > 0 ? finalTotal : 10,
      payment: paymentLabel,
      paymentMethod,
      paymentStatus: "Pending",
      status: "Pending",
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      couponDiscount: couponDiscountVal,
    };
  };

  const getItemTotal = (item: any) => {
    const itemPrice = Number(item.price) || 0;
    const itemDiscount = Number(item.discount) || 0;
    const itemSubtotal = itemPrice * item.quantity;
    const itemDiscountAmount = itemDiscount > 0 ? (itemDiscount / 100) * itemSubtotal : 0;
    return itemSubtotal - itemDiscountAmount;
  };

  const shippingSavings =
    useShippingMethodPicker && shippingMethod === "free_online" ? deliveryCodAmount : 0;
  const freeShippingLabel = getShippingMethodFreeLabel(deliverySettings);

  const orderSummaryTotals = (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-green-700">
          <span>Product discount</span>
          <span>-{formatMoney(discount)}</span>
        </div>
      )}
      {couponDiscountVal > 0 && (
        <div className="flex justify-between text-purple-700">
          <span>Coupon ({appliedCoupon?.code})</span>
          <span>-{formatMoney(couponDiscountVal)}</span>
        </div>
      )}
      {(useShippingMethodPicker || (!useShippingMethodPicker && shippingCost > 0)) && (
        <div className="flex justify-between text-gray-600 items-start gap-4">
          <span>{useShippingMethodPicker ? "Shipping" : "COD fee"}</span>
          <div className="text-right flex gap-2">
            {useShippingMethodPicker && shippingMethod === "free_online" && deliveryCodAmount > 0 ? (
              <>
                <span className="line-through text-gray-400 block">{formatMoney(deliveryCodAmount)}</span>
                <span className="font-semibold text-gray-900">FREE</span>
              </>
            ) : shippingCost > 0 ? (
              <span>{formatMoney(shippingCost)}</span>
            ) : (
              <span className="font-semibold text-gray-900">FREE</span>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-between text-base font-semibold text-gray-900 pt-3 border-t border-gray-200">
        <span>Total</span>
        <span>{formatMoney(finalTotal)}</span>
      </div>
      {shippingSavings > 0 && (
        <p className="text-xs text-gray-500 uppercase tracking-wide pt-1">{freeShippingLabel}</p>
      )}
      {shippingSavings > 0 && (
        <p className="text-sm font-semibold text-gray-900">
          TOTAL SAVINGS {formatMoney(shippingSavings)}
        </p>
      )}
    </div>
  );

  const orderSummaryItems = (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <p className="text-red-600 text-sm font-medium">Your cart is empty.</p>
      ) : (
        cartItems.map((item: any) => (
          <div key={item.id} className="flex gap-3 items-start">
            <div className="relative shrink-0">
              <img
                src={item.image || "/product.png"}
                alt={item.name}
                className="w-16 h-16 rounded-md border border-gray-200 object-cover bg-white"
              />
              <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
              {(item.selectedColor || item.selectedSize || item.selectedCustomValue) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {[item.selectedColor, item.selectedSize, item.selectedCustomValue].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 shrink-0">{formatMoney(getItemTotal(item))}</span>
          </div>
        ))
      )}
    </div>
  );

  const orderSummaryBlock = (variant: "inline" | "sidebar") => (
    <div className={variant === "inline" ? "mb-6 p-4 border rounded-lg" : ""}>
      {variant === "inline" && <h3 className="font-semibold mb-3 text-lg">Order Summary</h3>}
      {orderSummaryItems}
      <div className={variant === "sidebar" ? "mt-6" : "mt-4"}>{orderSummaryTotals}</div>
    </div>
  );

  const couponSection = couponsEnabled && cartItems.length > 0 && (
    <div className={isPage ? sectionClass : "mb-6 p-4 border rounded-lg bg-gray-50 border-gray-200"}>
      {isPage ? (
        <h3 className={sectionTitleClass}>Discount code</h3>
      ) : (
        <h3 className="font-semibold mb-2 text-sm text-gray-800 flex items-center gap-1.5">
          <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-bold font-mono">%</span>
          Promo Code / Coupon Discount
        </h3>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Discount code"
          value={couponCode}
          disabled={!!appliedCoupon || isValidatingCoupon}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className={`${inputClass} flex-1 font-medium uppercase`}
          style={{ borderColor: appliedCoupon ? undefined : "var(--theme-primary)" }}
        />
        {appliedCoupon ? (
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={isValidatingCoupon || !couponCode.trim()}
            className="px-4 py-2 disabled:opacity-50 text-white rounded-md text-sm font-medium"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            {isValidatingCoupon ? "..." : "Apply"}
          </button>
        )}
      </div>
      {couponError && <p className="text-red-600 text-xs mt-1.5">{couponError}</p>}
      {couponSuccess && <p className="text-green-700 text-xs mt-1.5">{couponSuccess}</p>}
    </div>
  );

  const addressSection = (
    <div className={isPage ? sectionClass : "mb-6 p-4 border rounded-lg"}>
      <h3 className={isPage ? sectionTitleClass : "font-semibold mb-2 text-lg"}>
        {isPage ? "Delivery" : "Billing / Shipping Address"}
      </h3>

      {isPage && (
        <ProductDeliveryInfo
          paymentSettings={paymentSettings}
          formatMoney={formatMoney}
          className="mb-2"
        />
      )}

      <div className="mb-4 flex items-center justify-between gap-6">
        <div>Use Shipping Address</div>

        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name="addressType"
            value="new"
            checked={addressType === "new"}
            onChange={() => setAddressType("new")}
          />
          <span>New Address</span>
        </label>

        {addresses.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="addressType"
              value="existing"
              checked={addressType === "existing"}
              onChange={() => {
                setAddressType("existing");
                if (selectedAddressIndex === null && addresses.length > 0) {
                  setSelectedAddressIndex(0);
                }
              }}
            />
            <span>Saved Address</span>
          </label>
        )}
      </div>

      {addressType === "existing" && addresses.length > 0 && (
        <div className="space-y-3 mb-4">
          {addresses.map((addr, index) => (
            <label
              key={index}
              className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${selectedAddressIndex === index
                ? "border-[var(--theme-primary)] bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <input
                type="radio"
                name="selectedAddress"
                checked={selectedAddressIndex === index}
                onChange={() => setSelectedAddressIndex(index)}
                className="mt-1"
              />
              <div className="flex-1 text-sm">
                <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                <p className="text-gray-600">{addr.line1}{addr.area ? `, ${addr.area}` : ""}</p>
                <p className="text-gray-600">{addr.city}, {addr.province} {addr.postalCode}</p>
                <p className="text-gray-600">{addr.phone}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {addressType === "new" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="First name *"
                value={newAddress.firstName}
                onChange={(e) => {
                  setNewAddress((prev) => ({ ...prev, firstName: e.target.value }));
                  if (addressErrors.firstName) setAddressErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                className={`${inputClass} ${addressErrors.firstName ? "border-red-500" : ""}`}
              />
              {addressErrors.firstName && <p className="text-red-500 text-xs mt-1">{addressErrors.firstName}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Last name *"
                value={newAddress.lastName}
                onChange={(e) => {
                  setNewAddress((prev) => ({ ...prev, lastName: e.target.value }));
                  if (addressErrors.lastName) setAddressErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                className={`${inputClass} ${addressErrors.lastName ? "border-red-500" : ""}`}
              />
              {addressErrors.lastName && <p className="text-red-500 text-xs mt-1">{addressErrors.lastName}</p>}
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Phone *"
              value={newAddress.phone}
              onChange={(e) => {
                handlePhoneChange(e.target.value);
                if (addressErrors.phone) setAddressErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              className={`${inputClass} ${addressErrors.phone ? "border-red-500" : ""}`}
            />
            {addressErrors.phone && <p className="text-red-500 text-xs mt-1">{addressErrors.phone}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Address *"
              value={newAddress.line1}
              onChange={(e) => {
                setNewAddress((prev) => ({ ...prev, line1: e.target.value }));
                if (addressErrors.line1) setAddressErrors((prev) => ({ ...prev, line1: undefined }));
              }}
              className={`${inputClass} ${addressErrors.line1 ? "border-red-500" : ""}`}
            />
            {addressErrors.line1 && <p className="text-red-500 text-xs mt-1">{addressErrors.line1}</p>}
          </div>
          <input
            type="text"
            placeholder="Apartment, suite, etc. (optional)"
            value={newAddress.area}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, area: e.target.value }))}
            className={inputClass}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="City *"
                value={newAddress.city}
                onChange={(e) => {
                  setNewAddress((prev) => ({ ...prev, city: e.target.value }));
                  if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: undefined }));
                }}
                className={`${inputClass} ${addressErrors.city ? "border-red-500" : ""}`}
              />
              {addressErrors.city && <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Province *"
                value={newAddress.province}
                onChange={(e) => {
                  setNewAddress((prev) => ({ ...prev, province: e.target.value }));
                  if (addressErrors.province) setAddressErrors((prev) => ({ ...prev, province: undefined }));
                }}
                className={`${inputClass} ${addressErrors.province ? "border-red-500" : ""}`}
              />
              {addressErrors.province && <p className="text-red-500 text-xs mt-1">{addressErrors.province}</p>}
            </div>
          </div>
          <div>
            <input
              type="text"
              placeholder="Postal code *"
              value={newAddress.postalCode}
              onChange={(e) => {
                setNewAddress((prev) => ({ ...prev, postalCode: e.target.value }));
                if (addressErrors.postalCode) setAddressErrors((prev) => ({ ...prev, postalCode: undefined }));
              }}
              className={`${inputClass} ${addressErrors.postalCode ? "border-red-500" : ""}`}
            />
            {addressErrors.postalCode && <p className="text-red-500 text-xs mt-1">{addressErrors.postalCode}</p>}
          </div>
          <button
            className="w-full p-2.5 rounded-md text-white text-sm font-medium theme-button flex items-center justify-center gap-2 disabled:opacity-70"
            onClick={handleAddressSave}
            disabled={savingAddress}
          >
            {savingAddress && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
            Save address
          </button>
        </div>
      )}
    </div>
  );

  const shippingMethodSection = useShippingMethodPicker && (
    <div className={sectionClass}>
      <h3 className={sectionTitleClass}>Shipping method</h3>
      <div className="space-y-2">
        <label
          className={`flex items-center justify-between gap-3 cursor-pointer p-4 border rounded-md transition-colors ${
            shippingMethod === "cod_delivery"
              ? "border-[var(--theme-primary)] bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <input
              type="radio"
              name="shippingMethod"
              value="cod_delivery"
              checked={shippingMethod === "cod_delivery"}
              onChange={() => setShippingMethod("cod_delivery")}
              className="shrink-0"
            />
            <span className="text-sm font-medium text-gray-900">{getShippingMethodCodLabel()}</span>
          </span>
          <span className="text-sm font-medium text-gray-900 shrink-0">
            {formatMoney(deliveryCodAmount)}
          </span>
        </label>

        <label
          className={`flex items-center justify-between gap-3 cursor-pointer p-4 border rounded-md transition-colors ${
            shippingMethod === "free_online"
              ? "border-[var(--theme-primary)] bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="flex items-center gap-3 min-w-0">
            <input
              type="radio"
              name="shippingMethod"
              value="free_online"
              checked={shippingMethod === "free_online"}
              onChange={() => setShippingMethod("free_online")}
              className="shrink-0"
            />
            <span className="text-sm font-medium text-gray-900">{freeShippingLabel}</span>
          </span>
          <div className="text-right shrink-0 flex gap-2">
            {deliveryCodAmount > 0 && (
              <span className="text-sm text-gray-400 line-through block">{formatMoney(deliveryCodAmount)}</span>
            )}
            <span className="text-sm font-semibold text-gray-900">FREE</span>
          </div>
        </label>
      </div>
    </div>
  );

  const paymentSection = (
    <>
      <div className={isPage ? sectionClass : "mb-4 p-4 border rounded-lg"}>
        <h3 className={isPage ? sectionTitleClass : "font-semibold mb-2 text-lg"}>Payment</h3>
        {isPage && (
          <p className="text-sm text-gray-600 mb-3">All transactions are secure and encrypted.</p>
        )}
        {!paymentSettings.enableCard &&
          !paymentSettings.enableCod &&
          !paymentSettings.enableBankDeposit ? (
          <p className="text-sm text-gray-600">
            No payment methods are available right now. Please contact the store.
          </p>
        ) : useShippingMethodPicker ? (
          <div className="space-y-2">
            {shippingMethod === "cod_delivery" && paymentSettings.enableCod && (
              <div className="p-4 border rounded-md border-gray-200 bg-white">
                <p className="text-sm font-medium text-gray-900">Cash on Delivery (COD)</p>
                {deliveryCodAmount > 0 && (
                  <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-100 rounded-md">
                    Cash Handling Charges {formatMoney(deliveryCodAmount)} applies on all COD orders
                  </p>
                )}
              </div>
            )}
            {shippingMethod === "free_online" && hasOnlinePayment && (
              <div className="p-4 border rounded-md border-gray-200 bg-white">
                <p className="text-sm font-medium text-gray-900">
                  {paymentSettings.enableCard ? "Online Payment" : "Bank deposit"}
                </p>
                <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-100 rounded-md">
                  {paymentSettings.enableCard
                    ? "You'll be redirected to Online Payment to complete your purchase."
                    : "Transfer the order total to complete your purchase."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {paymentSettings.enableCard && (
              <label className="flex items-center gap-2 cursor-pointer text-sm p-3 border rounded-md border-gray-200">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <span>Credit / Debit card</span>
              </label>
            )}
            {paymentSettings.enableCod && (
              <label className="flex items-center gap-2 cursor-pointer text-sm p-3 border rounded-md border-gray-200">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>
                  Cash on delivery
                  {deliveryCodAmount > 0 && (
                    <span className="text-gray-500">
                      {" "}
                      (+{formatMoney(deliveryCodAmount)} COD fee)
                    </span>
                  )}
                </span>
              </label>
            )}
            {paymentSettings.enableBankDeposit && (
              <label className="flex items-center gap-2 cursor-pointer text-sm p-3 border rounded-md border-gray-200">
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() => setPaymentMethod("bank")}
                />
                <span>Bank deposit</span>
              </label>
            )}
          </div>
        )}
      </div>

      {paymentSettings.enableCard && paymentMethod === "card" && (
        <div className={isPage ? sectionClass : ""}>
          <StripeCardForm
            amount={finalTotal > 0 ? finalTotal : 10}
            onBeforePayment={async () => {
              if (addressType === "new" && !validateAddress()) {
                throw new Error("Please fill all required address fields correctly.");
              }
              const order = await createOrder(buildOrderData(paymentMethod));
              success("Order created successfully!");
              return order;
            }}
            onSuccess={async (order) => {
              if (!order?._id) {
                error("Order was created but confirmation details are missing. Please contact support.");
                return;
              }
              try {
                const updated = await updateOrderPaymentStatus(order._id, "Received");
                await finishOrder({ ...order, ...updated, paymentStatus: "Received" }, "Card Payment");
                success("Order successfully placed!");
              } catch (err) {
                console.error(err);
                error("Failed to complete order. Please contact support.");
              }
            }}
          />
        </div>
      )}

      {paymentSettings.enableCod && paymentMethod === "cod" && (
        <div className={isPage ? "p-4 border border-gray-200 rounded-md bg-gray-50" : "mb-4 p-4 border rounded-lg bg-blue-50"}>
          <p className="text-sm text-gray-700 mb-4">
            You will pay cash when the order is delivered to your address.
          </p>
          <button
            onClick={async () => {
              if (addressType === "new" && !validateAddress()) {
                error("Please fill all required address fields correctly.");
                return;
              }
              if (placingOrder) return;
              setPlacingOrder(true);
              try {
                const order = await createOrder(buildOrderData("Cash on Delivery"));
                await finishOrder(order, "Cash on Delivery");
                success("Order successfully placed! You will pay cash on delivery.");
              } catch (err: any) {
                console.error(err);
                error(err.message || "Failed to place order. Please try again.");
              } finally {
                setPlacingOrder(false);
              }
            }}
            disabled={placingOrder}
            className="w-full px-4 py-3 theme-button rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {placingOrder && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />}
            {placingOrder ? "Placing order..." : "Complete order"}
          </button>
        </div>
      )}

      {paymentSettings.enableBankDeposit && paymentMethod === "bank" && (
        <div className={isPage ? "p-4 border border-gray-200 rounded-md bg-gray-50" : "mb-4 p-4 border rounded-lg bg-blue-50"}>
          <p className="text-sm text-gray-700 mb-4">
            Transfer the order total to the bank account below, then complete your order.
          </p>
          <div className="text-sm text-gray-800 space-y-1 mb-4 p-3 bg-white border border-gray-200 rounded-md">
            {paymentSettings.bankName && (
              <p>
                <span className="font-medium">Bank:</span> {paymentSettings.bankName}
              </p>
            )}
            {paymentSettings.accountName && (
              <p>
                <span className="font-medium">Account name:</span> {paymentSettings.accountName}
              </p>
            )}
            {paymentSettings.iban && (
              <p>
                <span className="font-medium">IBAN:</span> {paymentSettings.iban}
              </p>
            )}
            {paymentSettings.accountNumber && (
              <p>
                <span className="font-medium">Account number:</span> {paymentSettings.accountNumber}
              </p>
            )}
            <p>
              <span className="font-medium">Amount:</span> {formatMoney(finalTotal > 0 ? finalTotal : 10)}
            </p>
          </div>
          {paymentSettings.thankYouNote && (
            <p className="text-sm text-gray-600 mb-4">{paymentSettings.thankYouNote}</p>
          )}
          {paymentSettings.whatsappNumber && (
            <p className="text-sm text-gray-600 mb-4">
              Send payment proof on WhatsApp:{" "}
              <a
                href={`https://wa.me/${paymentSettings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="theme-text-primary underline"
              >
                {paymentSettings.whatsappNumber}
              </a>
            </p>
          )}
          <button
            onClick={async () => {
              if (addressType === "new" && !validateAddress()) {
                error("Please fill all required address fields correctly.");
                return;
              }
              if (placingOrder) return;
              setPlacingOrder(true);
              try {
                const order = await createOrder(buildOrderData("Bank Deposit"));
                await finishOrder(order, "Bank Deposit");
                success("Order successfully placed! Please complete your bank transfer.");
              } catch (err: any) {
                console.error(err);
                error(err.message || "Failed to place order. Please try again.");
              } finally {
                setPlacingOrder(false);
              }
            }}
            disabled={placingOrder}
            className="w-full px-4 py-3 theme-button rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {placingOrder && <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />}
            {placingOrder ? "Placing order..." : "Complete order"}
          </button>
        </div>
      )}
    </>
  );

  const formSections = (
    <>
      {couponSection}
      {addressSection}
      {shippingMethodSection}
      {paymentSection}
    </>
  );

  if (!acceptOrders) {
    const pausedBlock = (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-amber-900 mb-1">Orders temporarily paused</p>
        <p className="text-sm text-amber-800 leading-relaxed">{ordersPausedMessage}</p>
      </div>
    );

    if (isPage) {
      return (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-12">
          <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 theme-heading text-center">
              Checkout
            </h2>
            {pausedBlock}
            {orderSummaryBlock("inline")}
          </div>
        </div>
      );
    }

    return (
      <div className="text-gray-900 space-y-4">
        <h2 className="text-xl font-semibold theme-heading">Checkout</h2>
        {pausedBlock}
        {orderSummaryBlock("inline")}
      </div>
    );
  }

  if (isPage) {
    return (
      <>
        <div className="lg:hidden border-b border-gray-200 bg-gray-50 max-w-6xl mx-auto w-full">
          <button
            type="button"
            onClick={() => setSummaryOpen((open) => !open)}
            className="w-full px-4 py-4 flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-[var(--theme-primary)] font-medium">
              {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {summaryOpen ? "Hide order summary" : "Show order summary"}
            </span>
            <span className="font-semibold text-gray-900">{formatMoney(finalTotal)}</span>
          </button>
          {summaryOpen && (
            <div className="px-4 pb-4 border-t border-gray-200">
              {orderSummaryBlock("sidebar")}
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto w-full border-x border-gray-200 lg:min-h-[calc(100vh-73px)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="px-4 sm:px-8 lg:px-10 py-8 lg:py-10 lg:border-r border-gray-200">
              <div className="max-w-lg mx-auto space-y-8">
                {formSections}
              </div>
            </div>

            <div className="hidden lg:block bg-gray-50 lg:border-l border-gray-200">
              <div className="sticky top-0 px-8 py-10">
                <div className="max-w-sm mx-auto">
                  {orderSummaryBlock("sidebar")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="text-gray-900">
      <h2 className="text-xl font-semibold mb-4 theme-heading">Checkout</h2>
      {orderSummaryBlock("inline")}
      {formSections}
    </div>
  );
};

export default CheckoutContent;
