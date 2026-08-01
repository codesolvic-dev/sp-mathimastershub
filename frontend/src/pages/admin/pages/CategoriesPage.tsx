// frontend/src/pages/admin/pages/CategoriesPage.tsx
import React, { useEffect, useState } from "react";
import EnhancedDataTable from "../components/table/EnhancedDataTable";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CategoryModal from "@/components/admin/product/CategoryModal";
import DraggableCategoriesTable from "@/components/admin/category/DraggableCategoriesTable";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  updateCategoryStatus,
} from "@/api/category.api";
import { getProducts } from "@/api/product.api";
import { getCachedData, setCachedData, removeCachedData, CACHE_KEYS } from "@/utils/cache";
import DeleteModal from "@/components/admin/product/DeleteModal";
import { Category } from "../../../types/Category";
import { useToast } from "@/components/ui/toast";
import StatusBadge from "@/components/ui/StatusBadge";

interface CategoryFromAPI {
  _id: string;
  name: string;
  icon: string;
  products: number;
  order?: number;
  status?: "active" | "inactive";
}

function productCategoryId(product: { category?: { _id?: string } | string | null; categoryId?: string | null }) {
  if (product.categoryId) return String(product.categoryId);
  const c = product.category;
  if (!c) return "";
  if (typeof c === "string") return c;
  return c._id ? String(c._id) : "";
}

function buildProductCountMap(products: { category?: { _id?: string } | string | null; categoryId?: string | null }[]) {
  const map = new Map<string, number>();
  for (const p of products) {
    const id = productCategoryId(p);
    if (id) map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

function mapCategories(
  data: CategoryFromAPI[],
  productCounts?: Map<string, number>
): Category[] {
  return data.map((cat) => {
    const id = String(cat._id);
    const liveCount = productCounts?.get(id);
    return {
      id,
      icon: cat.icon,
      name: cat.name,
      products: liveCount !== undefined ? liveCount : Number(cat.products) || 0,
      status: cat.status || "active",
    };
  });
}

export default function CategoriesPage() {
  const { success, error } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!getCachedData(CACHE_KEYS.ADMIN_CATEGORIES));
  const [savingOrder, setSavingOrder] = useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"add" | "edit" | "view">("add");
  const [selected, setSelected] = React.useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = getCachedData<Category[]>(CACHE_KEYS.ADMIN_CATEGORIES);
    return Array.isArray(cached) ? cached : [];
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchCategories = async () => {
    if (!getCachedData(CACHE_KEYS.ADMIN_CATEGORIES)) setLoading(true);
    try {
      const [data, products] = await Promise.all([getCategories(), getProducts()]);
      const counts = buildProductCountMap(Array.isArray(products) ? products : []);
      const mapped = mapCategories(data, counts);
      setCategories(mapped);
      setCachedData(CACHE_KEYS.ADMIN_CATEGORIES, mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSearchActive = search.trim().length > 0;

  const openAdd = () => {
    setSelected(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const openEdit = (row: Category) => {
    setSelected(row);
    setModalMode("edit");
    setModalOpen(true);
  };

  const openView = (row: Category) => {
    setSelected(row);
    setModalMode("view");
    setModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteTarget(category);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) {
      error("Category ID is missing!");
      return;
    }

    try {
      await deleteCategory(deleteTarget.id);
      removeCachedData(CACHE_KEYS.ADMIN_CATEGORIES);
      removeCachedData(CACHE_KEYS.CATEGORIES);
      success("Category deleted successfully!");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleStatusToggle = async (category: Category) => {
    if (!category.id) return;

    const nextStatus = category.status === "active" ? "inactive" : "active";
    const previous = categories;

    setCategories((current) =>
      current.map((item) =>
        item.id === category.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await updateCategoryStatus(category.id, nextStatus);
      removeCachedData(CACHE_KEYS.ADMIN_CATEGORIES);
      removeCachedData(CACHE_KEYS.CATEGORIES);
      success(`Category ${nextStatus === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      setCategories(previous);
      error(err.response?.data?.message || "Failed to update category status");
    }
  };

  const handleReorder = async (reordered: Category[]) => {
    const previous = categories;
    setCategories(reordered);
    setSavingOrder(true);

    try {
      const updated = await reorderCategories(reordered.map((category) => category.id));
      // Keep live product counts from current rows if API returns stale counts
      const countById = new Map(reordered.map((c) => [c.id, c.products || 0]));
      const mapped = mapCategories(updated).map((c) => ({
        ...c,
        products: countById.has(c.id) ? (countById.get(c.id) as number) : c.products,
      }));
      setCategories(mapped);
      setCachedData(CACHE_KEYS.ADMIN_CATEGORIES, mapped);
      removeCachedData(CACHE_KEYS.CATEGORIES);
      success("Category order updated");
    } catch (err: any) {
      setCategories(previous);
      error(err.response?.data?.message || "Failed to update category order");
    } finally {
      setSavingOrder(false);
    }
  };

  const getColumns = () => {
    const allColumns = [
      {
        name: "ID",
        cell: (_row: Category, index: number) => <span className="text-gray-600">{index + 1}</span>,
        minWidth: "60px",
      },
      {
        name: "Icon",
        cell: (row: Category) => (
          <img
            src={row.icon && row.icon.trim() !== "" ? row.icon : "/category.png"}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== window.location.origin + "/category.png") {
                target.src = "/category.png";
              }
            }}
          />
        ),
        minWidth: "80px",
      },
      {
        name: "Category",
        heading: (row: Category) => row.name,
        subInfo: (row: Category) => `${row.products || 0} products`,
        minWidth: "200px",
      },
      {
        name: "Status",
        cell: (row: Category) => (
          <button
            type="button"
            onClick={() => handleStatusToggle(row)}
            className="cursor-pointer"
            title={`Click to mark as ${row.status === "active" ? "inactive" : "active"}`}
          >
            <StatusBadge status={row.status || "active"} type="product" />
          </button>
        ),
        minWidth: "100px",
      },
    ];

    if (windowWidth < 600) {
      return allColumns.filter((_, idx) => [0, 1, 3].includes(idx));
    }

    if (windowWidth < 800) {
      return allColumns.filter((_, idx) => [0, 1, 3].includes(idx));
    }

    if (windowWidth < 900) {
      return allColumns.filter((_, idx) => [0, 1, 2, 3].includes(idx));
    }

    return allColumns;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold theme-heading">Categories</h2>
          {!isSearchActive && (
            <p className="text-sm text-gray-500 mt-1">Drag rows to arrange category order</p>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 text-black"
            />
          </div>

          <Button className="text-white theme-button" onClick={openAdd}>
            + Add New
          </Button>
        </div>
      </div>

      {isSearchActive && (
        <p className="mb-3 text-sm text-amber-700">
          Clear search to drag and arrange categories.
        </p>
      )}

      {savingOrder && (
        <p className="mb-3 text-sm text-gray-500">Saving category order...</p>
      )}

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} />
          </div>
        ) : isSearchActive ? (
          <EnhancedDataTable<Category>
            columns={getColumns()}
            data={filtered}
            onView={openView}
            onEdit={openEdit}
            onDelete={handleDeleteClick}
            pagination
          />
        ) : (
          <DraggableCategoriesTable
            data={categories}
            onReorder={handleReorder}
            onView={openView}
            onEdit={openEdit}
            onDelete={handleDeleteClick}
            onStatusToggle={handleStatusToggle}
          />
        )}
      </div>

      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        data={selected ?? undefined}
        onClose={() => setModalOpen(false)}
        onSubmit={async (formData) => {
          if (modalMode === "add") {
            await addCategory(formData);
          } else if (modalMode === "edit" && selected) {
            await updateCategory(selected.id, formData);
          }
          removeCachedData(CACHE_KEYS.ADMIN_CATEGORIES);
          removeCachedData(CACHE_KEYS.CATEGORIES);
          setModalOpen(false);
          fetchCategories();
        }}
      />
      <DeleteModal
        open={deleteOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
