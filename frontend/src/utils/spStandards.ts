/**
 * SP Components standards — shared across storefront, builder, and SpComponentsPage.
 */

/** Item Card → Show Item Hover (ProductCard + ProductGrid) */
export const spItemCard = {
  gridClassName: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6",
  gridRowGapPx: 10,
  demoMaxWidth: "max-w-[200px]",
} as const;

const PRODUCT_GRID_BY_COLUMNS: Record<number, string> = {
  3: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-6",
  4: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-6",
  5: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6",
};

export function spItemCardGridClass(columns: number = 5): string {
  return PRODUCT_GRID_BY_COLUMNS[columns] ?? spItemCard.gridClassName;
}

export type SpProductCardItem = {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  discount?: number;
};

/** Map API product shape → ProductGrid item */
export function toSpProductCardItem(product: {
  _id: string;
  name: string;
  price: number;
  image1?: string;
  discount?: number;
}): SpProductCardItem {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    image: product.image1,
    discount: product.discount,
  };
}
