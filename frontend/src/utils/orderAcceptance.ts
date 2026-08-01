export type OrderAcceptanceSettings = {
  acceptOrders: boolean;
  ordersPausedMessage: string;
};

export const DEFAULT_ORDERS_PAUSED_MESSAGE =
  "We're temporarily not accepting new orders. Please check back soon.";

export function getOrderAcceptance(
  paymentSettings?: {
    acceptOrders?: boolean;
    ordersPausedMessage?: string;
  } | null
): OrderAcceptanceSettings {
  return {
    acceptOrders: paymentSettings?.acceptOrders !== false,
    ordersPausedMessage:
      String(paymentSettings?.ordersPausedMessage || "").trim() ||
      DEFAULT_ORDERS_PAUSED_MESSAGE,
  };
}
