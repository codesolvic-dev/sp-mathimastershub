export type DeliverySettings = {
  codFee?: number;
  deliveryFee?: number;
  deliveryFreeText?: string;
  deliveryOnlineText?: string;
  deliveryDaysText?: string;
};

export const DEFAULT_DELIVERY_TEXT = {
  deliveryFreeText: "Free Delivery",
  deliveryOnlineText: "Online Payment",
  deliveryDaysText: "5 to 7 business days",
};

export function parseCodFee(value: unknown): number {
  const fee = Number(value);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

export function parseDeliveryFee(value: unknown): number {
  const fee = Number(value);
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

/** Combined COD shipping amount — single admin fee or legacy delivery + COD sum */
export function getCodShippingTotal(settings: DeliverySettings): number {
  const delivery = parseDeliveryFee(settings.deliveryFee);
  const cod = parseCodFee(settings.codFee);
  return delivery + cod;
}

/** Amount shown as "Delivery + COD Fee" on product page and COD checkout */
export function getDeliveryCodDisplayAmount(settings: DeliverySettings): number {
  return getCodShippingTotal(settings);
}

export function getShippingMethodCodLabel(): string {
  return "Delivery + COD Fee";
}

export function getShippingMethodFreeLabel(settings: DeliverySettings): string {
  const free = settings.deliveryFreeText?.trim() || DEFAULT_DELIVERY_TEXT.deliveryFreeText;
  const online = settings.deliveryOnlineText?.trim() || DEFAULT_DELIVERY_TEXT.deliveryOnlineText;
  return `${free} | ${online}`;
}

export function getDeliveryTitle(settings: DeliverySettings): string {
  return parseCodFee(settings.codFee) > 0 ? "Delivery + COD Fee" : "Delivery";
}

/** One-line body after title — e.g. "Free Delivery | Online Payment, 5 to 7 business days" */
export function getDeliverySubtitle(settings: DeliverySettings): string {
  const free = settings.deliveryFreeText?.trim() || DEFAULT_DELIVERY_TEXT.deliveryFreeText;
  const online = settings.deliveryOnlineText?.trim() || DEFAULT_DELIVERY_TEXT.deliveryOnlineText;
  const days = settings.deliveryDaysText?.trim() || DEFAULT_DELIVERY_TEXT.deliveryDaysText;
  return `${free} | ${online}, ${days}`;
}

/** Full single-line copy: "Delivery + COD Fee Rs 100, Free Delivery | Online Payment, …" */
export function formatDeliveryInfoLine(
  settings: DeliverySettings,
  formatMoney: (amount: number) => string
): string {
  const amount = getDeliveryCodDisplayAmount(settings);
  const subtitle = getDeliverySubtitle(settings);
  if (amount > 0) {
    return `Delivery + COD Fee ${formatMoney(amount)}, ${subtitle}`;
  }
  return `Delivery + COD Fee, ${subtitle}`;
}

export function deliverySettingsFromPayment(paymentSettings?: DeliverySettings | null): DeliverySettings {
  return {
    codFee: parseCodFee(paymentSettings?.codFee),
    deliveryFee: parseDeliveryFee(paymentSettings?.deliveryFee),
    deliveryFreeText: paymentSettings?.deliveryFreeText || DEFAULT_DELIVERY_TEXT.deliveryFreeText,
    deliveryOnlineText: paymentSettings?.deliveryOnlineText || DEFAULT_DELIVERY_TEXT.deliveryOnlineText,
    deliveryDaysText: paymentSettings?.deliveryDaysText || DEFAULT_DELIVERY_TEXT.deliveryDaysText,
  };
}
