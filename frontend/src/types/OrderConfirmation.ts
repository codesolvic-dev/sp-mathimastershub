import type { Address } from "./Order";
import { formatStoreMoney, getStoreCurrencyFromCache } from "@/utils/currency";

export type OrderConfirmationItem = {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  discount?: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedCustomValue?: string;
};

export type OrderConfirmationSnapshot = {
  orderId: string;
  confirmationNumber: string;
  customerName: string;
  firstName: string;
  email: string;
  payment: string;
  bill: number;
  currency: string;
  address: Address;
  items: OrderConfirmationItem[];
  couponCode?: string;
  couponDiscount?: number;
  subtotal: number;
  productDiscount: number;
  deliveryFee?: number;
  thankYouNote?: string;
};

const STORAGE_KEY = "lastOrderConfirmation";

export function saveOrderConfirmation(snapshot: OrderConfirmationSnapshot): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.error("Failed to save order confirmation:", err);
  }
}

export function getOrderConfirmation(orderId?: string): OrderConfirmationSnapshot | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as OrderConfirmationSnapshot;
    if (orderId && snapshot.orderId !== orderId) return null;
    return snapshot;
  } catch {
    return null;
  }
}

export function formatConfirmationNumber(orderId: string, orderNumber?: number | null): string {
  if (orderNumber != null && Number.isFinite(orderNumber)) {
    return String(orderNumber);
  }
  return orderId.slice(-9).toUpperCase();
}

export function formatOrderMoney(amount: number, currency?: string): string {
  return formatStoreMoney(amount, currency || getStoreCurrencyFromCache());
}
