import React from "react";
import ProductCard from "./ProductCard";
import { spItemCard, spItemCardGridClass } from "@/utils/spStandards";
import { hasProductDiscount } from "@/utils/productDiscount";

interface Product {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  discount?: number;
  views?: number;
}

interface ProductGridProps {
  items: Product[];
  limit?: number;
  /** Products per row on large screens (3, 4, or 5) */
  columns?: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({ items, limit, columns }) => {
  const displayedItems = limit ? items.slice(0, limit) : items;
  const gridClassName = columns ? spItemCardGridClass(columns) : spItemCard.gridClassName;

  return (
    <div className={gridClassName} style={{ rowGap: `${spItemCard.gridRowGapPx}px` }}>
      {displayedItems.map((product, index) => (
        <ProductCard
          key={product.id || index}
          id={product.id}
          name={product.name}
          price={product.price}
          image={product.image && product.image.trim() !== "" ? product.image : "/product.png"}
          discount={product.discount}
          offer={hasProductDiscount(product.discount) ? String(product.discount) : undefined}
          views={product.views}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
