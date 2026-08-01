/** Shopify-style display: #1001, #1002, … */
export function formatOrderNumber(
  orderNumber?: number | null,
  orderId?: string
): string {
  if (orderNumber != null && Number.isFinite(orderNumber)) {
    return `#${orderNumber}`;
  }
  if (orderId) {
    return `#${orderId.slice(-8).toUpperCase()}`;
  }
  return "#—";
}
