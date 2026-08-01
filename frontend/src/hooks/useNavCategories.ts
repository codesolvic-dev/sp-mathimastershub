import { useEffect, useState } from "react";
import { CACHE_KEYS, getCachedData } from "@/utils/cache";
import { fetchCategoriesShared, type CategoryRecord } from "@/utils/categoryFetch";

export type NavCategory = {
  _id: string;
  name: string;
};

export function getShopCategoryHref(categoryName: string) {
  return `/shop?category=${encodeURIComponent(categoryName)}`;
}

export function useNavCategories() {
  const [categories, setCategories] = useState<NavCategory[]>(() => {
    const cached = getCachedData<CategoryRecord[]>(CACHE_KEYS.CATEGORIES);
    return Array.isArray(cached) ? cached : [];
  });

  useEffect(() => {
    let cancelled = false;
    fetchCategoriesShared({ preferCache: true, preloadImages: true })
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
