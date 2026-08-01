import React, { useEffect, useState } from "react";
import { Eye, Share2 } from "lucide-react";
import EnhancedDataTable from "../components/table/EnhancedDataTable";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts, createProduct, updateProduct, updateProductStatus, deleteProduct as apiDelete } from "@/api/product.api";
import { getCategories } from "@/api/category.api";
import DeleteModal from "../../../components/admin/product/DeleteModal";
import ProductImportExportActions from "../../../components/admin/product/ProductImportExportActions";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { CACHE_KEYS, getCachedData, setCachedData, removeCachedData } from "@/utils/cache";
import { useToast } from "@/components/ui/toast";

const ProductModal = React.lazy(
  () => import("../../../components/admin/product/ProductModal")
);

const ADMIN_PRODUCTS_CACHE_MS = 90 * 1000;

interface Category {
  _id: string;
  name: string;
}

interface ProductAPI {
  _id: string;
  name: string;
  description: string;
  category: string | { _id: string; name: string };
  price: number;
  currency: string;
  status: "active" | "inactive";
  discount?: number;
  sku?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  views?: number;
  shares?: number;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  categoryName?: string;
  price: number;
  currency: string;
  status: "active" | "inactive";
  discount?: number;
  sku?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  views?: number;
  shares?: number;
}

type AdminProductsCache = {
  products: Product[];
  categories: Category[];
};

export default function ProductPage() {
  const { formatMoney } = useStoreCurrency();
  const { success, error } = useToast();
  const cached = getCachedData<AdminProductsCache>(CACHE_KEYS.ADMIN_PRODUCTS);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>(() =>
    Array.isArray(cached?.products) ? cached.products : []
  );
  const [filtered, setFiltered] = useState<Product[]>(() =>
    Array.isArray(cached?.products) ? cached.products : []
  );
  const [loading, setLoading] = useState(() => !cached?.products?.length);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selected, setSelected] = useState<Product | null>(null);
  const [openingModal, setOpeningModal] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>(() =>
    Array.isArray(cached?.categories) ? cached.categories : []
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

useEffect(() => {
  const handleResize = () => setWindowWidth(window.innerWidth);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);


  const mapProduct = (p: ProductAPI, cats: Category[]): Product => {
    let categoryId = "";
    let categoryName = "Unknown";

    if (typeof p.category === "string") {
      categoryId = p.category;
      const cat = cats.find(c => c._id === p.category);
      if (cat) categoryName = cat.name;
    } else if (typeof p.category === "object" && p.category?._id) {
      categoryId = p.category._id;
      categoryName = p.category.name || "Unknown";
    }

    return {
      ...p,
      id: p._id,
      category: categoryId,
      categoryName,
      status: p.status === "inactive" ? "inactive" : "active",
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const hasCache = !!getCachedData(CACHE_KEYS.ADMIN_PRODUCTS);
      if (!hasCache) setLoading(true);
      try {
        const [cats, productsArray] = await Promise.all([getCategories(), getProducts()]);
        setCategories(cats);
        const mapped = productsArray.map((p: ProductAPI) => mapProduct(p, cats));
        setProducts(mapped);
        setFiltered(mapped);
        setCachedData(
          CACHE_KEYS.ADMIN_PRODUCTS,
          { products: mapped, categories: cats } satisfies AdminProductsCache,
          ADMIN_PRODUCTS_CACHE_MS
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchProducts = async () => {
    const cats =
      categories.length > 0
        ? categories
        : ((await getCategories().catch(() => [])) as Category[]);
    if (cats !== categories && cats.length) setCategories(cats);
    const productsArray = await getProducts({ fresh: true });
    const mapped = productsArray.map((p: ProductAPI) => mapProduct(p, cats));
    setProducts(mapped);
    setFiltered(mapped);
    setCachedData(
      CACHE_KEYS.ADMIN_PRODUCTS,
      { products: mapped, categories: cats } satisfies AdminProductsCache,
      ADMIN_PRODUCTS_CACHE_MS
    );
  };

  const addProduct = async (product: Product) => {
    const newProduct = await createProduct(product);
    const mapped = mapProduct(newProduct, categories);
    setProducts(prev => [...prev, mapped]);
    setFiltered(prev => [...prev, mapped]);
  };

  const updateProductApi = async (id: string, product: Product) => {
    await updateProduct(id, product);
    fetchProducts();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    await apiDelete(deleteId);
    setDeleteLoading(false);
    setDeleteOpen(false);
    fetchProducts();
  };

  const handleStatusToggle = async (product: Product) => {
    if (!product.id) return;
    const nextStatus: Product["status"] = product.status === "active" ? "inactive" : "active";
    const previousProducts = products;

    const applyStatus = (list: Product[]): Product[] =>
      list.map((item) => (item.id === product.id ? { ...item, status: nextStatus } : item));

    setProducts(applyStatus);
    setFiltered((current) => applyStatus(current));

    try {
      await updateProductStatus(product.id, nextStatus);
      removeCachedData(CACHE_KEYS.PRODUCTS);
      setCachedData(
        CACHE_KEYS.ADMIN_PRODUCTS,
        {
          products: applyStatus(previousProducts),
          categories,
        } satisfies AdminProductsCache,
        ADMIN_PRODUCTS_CACHE_MS
      );
      success(`Product ${nextStatus === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      setProducts(previousProducts);
      setFiltered(
        search
          ? previousProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
          : previousProducts
      );
      error(err?.response?.data?.message || "Failed to update product status");
    }
  };

  useEffect(() => {
    if (!search) return setFiltered(products);
    setFiltered(products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, products]);

  const openAddModal = () => {
    if (openingModal) return;
    setOpeningModal(true);
    setSelected(null);
    setModalMode("add");
    setModalOpen(true);
    setOpeningModal(false);
  };
  const openEditModal = (product: Product) => { setSelected(product); setModalMode("edit"); setModalOpen(true); };
  const openViewModal = (product: Product) => { setSelected(product); setModalMode("view"); setModalOpen(true); };

const getColumns = () => {
  const allColumns = [
    { 
      name: "ID", 
      cell: (_row: Product, i: number) => <span className="text-gray-600">{i + 1}</span>,
      minWidth: "60px"
    },
    {
      name: "Image",
      cell: (row: Product) => (
        <img 
          src={row.image1 || row.image2 || "/product.png"} 
          alt={row.name} 
          className="w-10 h-10 rounded-full object-cover border border-gray-200" 
        />
      ),
      minWidth: "80px"
    },
    { 
      name: "Product", 
      heading: (row: Product) => row.name,
      subInfo: (row: Product) => row.categoryName || row.category || "No category",
      minWidth: "200px"
    },
    { 
      name: "Description", 
      selector: (row: Product) => row.description?.substring(0, 50) + (row.description?.length > 50 ? "..." : "") || "No description",
      minWidth: "200px"
    },
    { 
      name: "Price", 
      heading: (row: Product) => formatMoney(row.price),
      subInfo: (row: Product) => row.discount ? `${row.discount}% OFF` : "No discount",
      minWidth: "120px"
    },
    {
      name: "Views",
      cell: (row: Product) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
          <Eye size={14} className="text-gray-400 shrink-0" />
          {(row.views ?? 0).toLocaleString()}
        </span>
      ),
      minWidth: "90px",
    },
    {
      name: "Shares",
      cell: (row: Product) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
          <Share2 size={14} className="text-gray-400 shrink-0" />
          {(row.shares ?? 0).toLocaleString()}
        </span>
      ),
      minWidth: "90px",
    },
    { 
      name: "Status", 
      cell: (row: Product) => (
        <button
          type="button"
          onClick={() => handleStatusToggle(row)}
          className="cursor-pointer"
          title={`Click to mark as ${row.status === "active" ? "inactive" : "active"}`}
        >
          <StatusBadge status={row.status || "active"} type="product" />
        </button>
      ),
      minWidth: "100px"
    },
  ];

  // Breakpoints: 600px, 800px, 900px, 1000px, 1200px, 2040px
  if (windowWidth < 600) {
    // Very small screens: ID, Image, Product, Status, Actions
    return allColumns.filter((_, idx) => [0, 1, 2, 7].includes(idx));
  }

  if (windowWidth < 800) {
    // Small screens: ID, Image, Product, Views, Status, Actions
    return allColumns.filter((_, idx) => [0, 1, 2, 5, 7].includes(idx));
  }

  if (windowWidth < 900) {
    // Medium-small screens: ID, Image, Product, Price, Views, Shares, Status, Actions
    return allColumns.filter((_, idx) => [0, 1, 2, 4, 5, 6, 7].includes(idx));
  }

  if (windowWidth < 1000) {
    // Medium screens: ID, Image, Product, Description, Price, Views, Shares, Status, Actions
    return allColumns.filter((_, idx) => [0, 1, 2, 3, 4, 5, 6, 7].includes(idx));
  }

  if (windowWidth < 1200) {
    // Large-medium screens: all columns
    return allColumns.filter((_, idx) => [0, 1, 2, 3, 4, 5, 6, 7].includes(idx));
  }

  // Extra large screens (1200px+): All columns
  return allColumns;
};



  return (
    <div className="bg-white shadow rounded-lg p-4 md:p-6 w-full max-w-full min-w-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-0">
        <h2 className="text-2xl font-semibold theme-heading">Products</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
          <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 text-black" />
          <ProductImportExportActions onImported={fetchProducts} />
          <Button className="text-white w-full sm:w-auto theme-button" onClick={openAddModal} loading={openingModal}>
            + Add New
          </Button>
        </div>
      </div>

    <div className="w-full max-w-full min-w-0 overflow-x-auto bg-white rounded-lg border border-gray-200">
      {loading && products.length === 0 ? (
        <div className="p-4">
          <DataTableSkeleton rows={8} />
        </div>
      ) : (
        <EnhancedDataTable<Product>
          columns={getColumns()}
          data={filtered}
          onView={openViewModal}
          onEdit={openEditModal}
          onDelete={(row) => {
            setDeleteId(row.id || null);
            setDeleteOpen(true);
          }}
          pagination
        />
      )}
    </div>


      {modalOpen && (
        <React.Suspense fallback={null}>
          <ProductModal
            open={modalOpen}
            mode={modalMode}
            categories={categories}
            data={selected ?? undefined}
            onClose={() => setModalOpen(false)}
            submitting={submitLoading}
            onSubmit={async (payload) => {
              setSubmitLoading(true);
              try {
                const productPayload: Product = {
                  ...payload,
                  category:
                    typeof payload.category === "object"
                      ? payload.category._id
                      : payload.category,
                };
                if (modalMode === "add") await addProduct(productPayload);
                else if (modalMode === "edit" && selected?.id)
                  await updateProductApi(selected.id, productPayload);
                setModalOpen(false);
                await fetchProducts();
              } catch (err) {
                console.error(err);
              } finally {
                setSubmitLoading(false);
              }
            }}
          />
        </React.Suspense>
      )}

      <DeleteModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} loading={deleteLoading} title="Delete Product" message="Are you sure you want to delete this product? This action cannot be undone." />
    </div>
  );
}
