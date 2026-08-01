import React, { useEffect, useState } from "react";
import EnhancedDataTable from "../components/table/EnhancedDataTable";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { useToast } from "@/components/ui/toast";
import PageLoader from "@/components/ui/PageLoader";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/api/coupon.api";
import { getProducts } from "@/api/product.api";
import { Ticket, Percent, DollarSign, Calendar, Users, Info, Sparkles } from "lucide-react";

interface Coupon {
  id?: string;
  _id?: string;
  code: string;
  description?: string;
  type: "percentage" | "fixed" | "product_specific";
  amount: number;
  products?: any[]; // Associated product IDs or objects
  expiryDate?: string | null;
  usageLimitPerUser: number;
  status: "active" | "inactive";
  usedCount?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function CouponsPage() {
  const { formatMoney, currency } = useStoreCurrency();
  const { success, error } = useToast();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  
  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed" | "product_specific">("percentage");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchData();
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsData, productsData] = await Promise.all([
        getCoupons(),
        getProducts().catch(() => []),
      ]);
      
      const mappedCoupons = couponsData.map((c: any) => ({
        ...c,
        id: c._id,
      }));
      
      setCoupons(mappedCoupons);
      setProducts(productsData);
    } catch (err: any) {
      console.error(err);
      error("Failed to load coupons data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setSelectedCoupon(null);
    setFormCode("");
    setFormDescription("");
    setFormType("percentage");
    setFormAmount(0);
    setFormExpiryDate("");
    setFormUsageLimit(1);
    setFormStatus("active");
    setSelectedProductIds([]);
    
    setModalMode("add");
    setModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || "");
    setFormType(coupon.type);
    setFormAmount(coupon.amount);
    
    if (coupon.expiryDate) {
      // Format to yyyy-MM-dd
      setFormExpiryDate(coupon.expiryDate.split("T")[0]);
    } else {
      setFormExpiryDate("");
    }
    
    setFormUsageLimit(coupon.usageLimitPerUser);
    setFormStatus(coupon.status);
    
    // Set selected products
    const prodIds = coupon.products?.map((p: any) => p._id || p) || [];
    setSelectedProductIds(prodIds);
    
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleOpenView = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || "");
    setFormType(coupon.type);
    setFormAmount(coupon.amount);
    
    if (coupon.expiryDate) {
      setFormExpiryDate(new Date(coupon.expiryDate).toLocaleDateString());
    } else {
      setFormExpiryDate("No Expiry Date");
    }
    
    setFormUsageLimit(coupon.usageLimitPerUser);
    setFormStatus(coupon.status);
    
    const prodIds = coupon.products?.map((p: any) => p._id || p) || [];
    setSelectedProductIds(prodIds);
    
    setModalMode("view");
    setModalOpen(true);
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setDeleteTarget(coupon);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    
    try {
      await deleteCoupon(deleteTarget.id);
      success("Coupon deleted successfully!");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  const generateAutoCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "DISC-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormCode(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formCode.trim()) {
      error("Coupon Code is required");
      return;
    }
    if (formAmount <= 0) {
      error("Coupon Amount must be greater than 0");
      return;
    }
    if (formType === "percentage" && formAmount > 100) {
      error("Percentage discount cannot exceed 100%");
      return;
    }
    if (formType === "product_specific" && selectedProductIds.length === 0) {
      error("Please select at least one product for product specific discount");
      return;
    }

    const payload = {
      code: formCode.toUpperCase().trim(),
      description: formDescription,
      type: formType,
      amount: Number(formAmount),
      products: formType === "product_specific" ? selectedProductIds : [],
      expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : null,
      usageLimitPerUser: Number(formUsageLimit),
      status: formStatus,
    };

    setIsSubmitting(true);
    try {
      if (modalMode === "add") {
        await createCoupon(payload);
        success("Coupon created successfully!");
      } else if (modalMode === "edit" && selectedCoupon?.id) {
        await updateCoupon(selectedCoupon.id, payload);
        success("Coupon updated successfully!");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      error(err.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    if (modalMode === "view") return;
    
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const getColumns = () => {
    const allColumns = [
      {
        name: "ID",
        cell: (_row: Coupon, index: number) => (
          <span className="text-gray-600 font-medium">{index + 1}</span>
        ),
        minWidth: "60px",
        width: "60px",
      },
      {
        name: "Coupon Code",
        cell: (row: Coupon) => (
          <div className="flex flex-col py-1">
            <span className="font-bold text-gray-900 tracking-wider text-sm theme-bg-primary-soft theme-text-primary px-2 py-0.5 rounded border theme-border-primary w-max">
              {row.code}
            </span>
            {row.description && (
              <span className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                {row.description}
              </span>
            )}
          </div>
        ),
        minWidth: "180px",
      },
      {
        name: "Type",
        cell: (row: Coupon) => {
          let label = "";
          let color = "";
          if (row.type === "percentage") {
            label = "Percentage (%)";
            color = "bg-blue-100 text-blue-800 border-blue-200";
          } else if (row.type === "fixed") {
            label = "Fixed Cart";
            color = "bg-emerald-100 text-emerald-800 border-emerald-200";
          } else {
            label = "Product Specific";
            color = "bg-amber-100 text-amber-800 border-amber-200";
          }
          return (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${color}`}>
              {label}
            </span>
          );
        },
        minWidth: "140px",
      },
      {
        name: "Discount Amount",
        cell: (row: Coupon) => (
          <span className="font-semibold text-gray-900">
            {row.type === "percentage" ? `${row.amount}%` : formatMoney(row.amount)}
          </span>
        ),
        minWidth: "130px",
      },
      {
        name: "Expiry Date",
        cell: (row: Coupon) => {
          if (!row.expiryDate) return <span className="text-gray-500 text-xs">No Expiry</span>;
          const exp = new Date(row.expiryDate);
          const isExpired = new Date() > exp;
          return (
            <span className={`text-xs font-medium ${isExpired ? "text-red-600 font-semibold" : "text-gray-700"}`}>
              {exp.toLocaleDateString()} {isExpired && "(Expired)"}
            </span>
          );
        },
        minWidth: "120px",
      },
      {
        name: "Usage Limit",
        cell: (row: Coupon) => (
          <div className="flex flex-col">
            <span className="text-sm text-gray-800">
              Limit: <span className="font-semibold">{row.usageLimitPerUser}</span> per user
            </span>
            <span className="text-xs text-gray-500">
              Used: <span className="font-semibold theme-text-primary">{row.usedCount || 0}</span> times
            </span>
          </div>
        ),
        minWidth: "140px",
      },
      {
        name: "Status",
        cell: (row: Coupon) => (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              row.status === "active"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {row.status === "active" ? "Active" : "Inactive"}
          </span>
        ),
        minWidth: "100px",
      },
    ];

    if (windowWidth < 768) {
      // Mobile: Code, Amount, Status
      return allColumns.filter((_, idx) => [1, 3, 6].includes(idx));
    }
    if (windowWidth < 1024) {
      // Tablet: Code, Type, Amount, Expiry, Status
      return allColumns.filter((_, idx) => [1, 2, 3, 4, 6].includes(idx));
    }
    return allColumns;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="theme-text-primary w-7 h-7" />
            Discount Coupons
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional, fixed, or product-specific discount coupons for checkout operations.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto min-w-0">
          {/* Search bar */}
          <div className="relative">
            <Input
              placeholder="Search Coupon Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 text-black border-gray-300 theme-focus"
            />
          </div>

          <Button
            className="theme-button shadow-md flex items-center gap-2"
            onClick={handleOpenAdd}
          >
            <Sparkles size={16} />
            + Add Coupon
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} />
          </div>
        ) : (
          <EnhancedDataTable<Coupon>
            columns={getColumns()}
            data={filteredCoupons}
            onView={handleOpenView}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteClick}
            pagination
          />
        )}
      </div>

      {/* Add / Edit / View Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white text-black max-w-lg md:max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <Ticket className="theme-text-primary w-5 h-5" />
              {modalMode === "add" && "Create Discount Coupon"}
              {modalMode === "edit" && "Modify Coupon Settings"}
              {modalMode === "view" && "Discount Coupon Details"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coupon Code Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code" className="text-sm font-semibold text-gray-700">
                  Coupon Code Name <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formCode}
                    disabled={modalMode === "view"}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="E.G. SUMMER50"
                    className="uppercase tracking-wider font-bold text-black border-gray-300 flex-1 focus:ring-[var(--theme-primary)]"
                  />
                  {modalMode !== "view" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateAutoCode}
                      className="theme-border-primary theme-text-primary hover:theme-bg-primary-soft font-medium"
                    >
                      Auto Generate
                    </Button>
                  )}
                </div>
                {modalMode !== "view" && (
                  <p className="text-xs text-gray-400">
                    Write custom code or click Auto-Generate to create an alphanumeric token.
                  </p>
                )}
              </div>

              {/* Coupon Type */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                  Coupon Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="type"
                  value={formType}
                  disabled={modalMode === "view"}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setFormType(val);
                    // Reset selected products if type changes
                    if (val !== "product_specific") setSelectedProductIds([]);
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] disabled:bg-gray-100"
                >
                  <option value="percentage">Discount Percentage (%) Coupon</option>
                  <option value="fixed">Fixed Cart Discount Coupon</option>
                  <option value="product_specific">Product Specific Discount Coupon</option>
                </select>
              </div>

              {/* Coupon Amount */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                  Discount Amount / Value <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formType === "percentage" ? (
                      <Percent className="h-4 w-4 text-gray-400" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="any"
                    value={formAmount}
                    disabled={modalMode === "view"}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="pl-9 text-black border-gray-300 focus:ring-[var(--theme-primary)]"
                    placeholder={formType === "percentage" ? "10%" : `500 ${currency}`}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {formType === "percentage"
                    ? "Enter percentage value (1-100%)."
                    : "Enter absolute discount amount in default store currency."}
                </p>
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiryDate" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type={modalMode === "view" ? "text" : "date"}
                  value={formExpiryDate}
                  disabled={modalMode === "view"}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="text-black border-gray-300 focus:ring-[var(--theme-primary)]"
                />
                {modalMode !== "view" && (
                  <p className="text-xs text-gray-400">
                    Optional. The coupon will cease to be valid after this date. Leave empty for no expiry.
                  </p>
                )}
              </div>

              {/* Usage Limit Per User */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="usageLimit" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  Usage Limit Per User
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formUsageLimit}
                  disabled={modalMode === "view"}
                  onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                  className="text-black border-gray-300 focus:ring-[var(--theme-primary)]"
                />
                {modalMode !== "view" && (
                  <p className="text-xs text-gray-400">
                    Specify how many times a single user profile can redeem this code.
                  </p>
                )}
              </div>

              {/* Coupon Status */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                  Coupon Status
                </Label>
                <select
                  id="status"
                  value={formStatus}
                  disabled={modalMode === "view"}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] disabled:bg-gray-100"
                >
                  <option value="active">Active (Redeemable)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Info className="w-4 h-4 text-gray-500" />
                Coupon Description (Optional)
              </Label>
              <Textarea
                id="description"
                value={formDescription}
                disabled={modalMode === "view"}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Give details about this discount deal..."
                className="text-black border-gray-300 focus:ring-[var(--theme-primary)] min-h-[70px]"
              />
            </div>

            {/* Product Specific Selector */}
            {formType === "product_specific" && (
              <div className="flex flex-col gap-2 border-t pt-4 mt-2">
                <Label className="text-sm font-bold text-gray-800">
                  Select Associated Products ({selectedProductIds.length} Selected) <span className="text-red-500">*</span>
                </Label>
                {modalMode !== "view" && (
                  <p className="text-xs text-gray-500 mb-2">
                    This coupon will apply only to the products checked below.
                  </p>
                )}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2.5 bg-gray-50">
                  {products.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2 text-center">No products found in the catalog.</p>
                  ) : (
                    products.map((prod) => {
                      const isChecked = selectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProductSelection(prod.id)}
                          className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition ${
                            isChecked
                              ? "theme-bg-primary-soft theme-border-primary theme-text-primary"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={modalMode === "view"}
                            onChange={() => {}} // Click handled by parent div
                            className="rounded border-gray-300 theme-checkbox focus:ring-[var(--theme-primary)] h-4 w-4"
                          />
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-medium">{prod.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                              {formatMoney(prod.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Modal actions */}
            {modalMode !== "view" && (
              <DialogFooter className="border-t pt-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="theme-button font-semibold"
                  loading={isSubmitting}
                >
                  {modalMode === "add" ? "Create Coupon" : "Save Changes"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Discount Coupon"
        message={`Are you sure you want to permanently delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        confirmText="Yes, Delete"
        cancelText="No, Keep It"
      />
    </div>
  );
}
