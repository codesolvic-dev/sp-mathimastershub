export function hasProductDiscount(discount?: number | string | null): boolean {
  const value = Number(discount);
  return Number.isFinite(value) && value > 0;
}

export function applyProductDiscount(price: number, discount?: number | string | null): number {
  if (!hasProductDiscount(discount)) return price;
  return Math.round(price - (price * Number(discount)) / 100);
}
