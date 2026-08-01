export const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Order Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Completed",
  "Cancelled",
  "Returned",
  "Refunded",
] as const;

export const PAYMENT_STATUS_OPTIONS = ["Pending", "Received", "Refund", "Failed"] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_OPTIONS)[number];
export type PaymentStatusValue = (typeof PAYMENT_STATUS_OPTIONS)[number];
export type PaymentTypeValue = "COD" | "Online" | "Card" | "Bank";

export function normalizeOrderStatus(status?: string): OrderStatusValue | string {
  const value = String(status || "Pending").trim().toLowerCase();
  switch (value) {
    case "pending":
      return "Pending";
    case "confirmed":
    case "order confirmed":
      return "Order Confirmed";
    case "processing":
      return "Processing";
    case "dispatched":
    case "shipped":
      return "Dispatched";
    case "delivered":
      return "Delivered";
    case "complete":
    case "completed":
      return "Completed";
    case "cancel":
    case "cancelled":
      return "Cancelled";
    case "returned":
      return "Returned";
    case "refunded":
      return "Refunded";
    default:
      return status || "Pending";
  }
}

export function normalizePaymentStatus(status?: string): PaymentStatusValue | string {
  const value = String(status || "Pending").trim().toLowerCase();
  if (value === "paid" || value === "received") return "Received";
  if (value === "failed") return "Failed";
  if (value === "pending") return "Pending";
  if (value === "refund" || value === "refunded") return "Refund";
  return status || "Pending";
}

export function getOrderStatusLabel(status?: string): string {
  return String(normalizeOrderStatus(status));
}

export function getPaymentStatusLabel(status?: string): string {
  return String(normalizePaymentStatus(status));
}

export function getOrderStatusStyles(status?: string): string {
  switch (normalizeOrderStatus(status)) {
    case "Pending":
      return "bg-orange-100 text-orange-800";
    case "Order Confirmed":
      return "bg-blue-100 text-blue-800";
    case "Processing":
      return "bg-indigo-100 text-indigo-800";
    case "Dispatched":
      return "bg-teal-100 text-teal-800";
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Completed":
      return "bg-green-200 text-green-900";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    case "Returned":
      return "bg-amber-100 text-amber-900";
    case "Refunded":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusStyles(status?: string): string {
  switch (normalizePaymentStatus(status)) {
    case "Pending":
      return "bg-orange-100 text-orange-800";
    case "Received":
      return "bg-green-100 text-green-800";
    case "Refund":
      return "bg-purple-100 text-purple-800";
    case "Failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentType(order: {
  payment?: string;
  paymentMethod?: string;
  type?: string;
}): PaymentTypeValue {
  const method = String(order.paymentMethod || "").toLowerCase().trim();
  const payment = String(order.payment || "").toLowerCase().trim();

  if (method === "cod" || payment.includes("cash") || payment.includes("cod")) {
    return "COD";
  }
  if (method === "card" || payment.includes("card")) {
    return "Card";
  }
  if (method === "bank" || payment.includes("bank") || payment.includes("deposit")) {
    return "Bank";
  }
  if (String(order.type || "").toLowerCase() === "online") {
    return "Online";
  }
  return "Online";
}

export function formatReturnReason(order: {
  returnedBy?: "user" | "admin" | string;
  returnReason?: string;
}): string | null {
  const reason = String(order.returnReason || "").trim();
  if (!reason) return null;

  const who =
    order.returnedBy === "admin"
      ? "Admin"
      : order.returnedBy === "user"
        ? "User"
        : "User";

  return `Return by (${who}) - ${reason}`;
}

export function orderStatusMatchesFilter(status: string, filter: string): boolean {
  const normalized = normalizeOrderStatus(status);
  const filterValue = filter.toLowerCase();

  if (filterValue === "all") return true;
  if (filterValue === "cancel" || filterValue === "cancelled") {
    return normalized === "Cancelled";
  }
  if (filterValue === "complete" || filterValue === "completed") {
    return normalized === "Completed" || normalized === "Delivered";
  }
  if (filterValue === "returned") {
    return normalized === "Returned";
  }
  return String(normalized).toLowerCase() === filterValue;
}
