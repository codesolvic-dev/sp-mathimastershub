import React, { useEffect, useState } from "react";
import EnhancedDataTable from "../../../pages/admin/components/table/EnhancedDataTable";
import { fetchOrders } from "../../../api/order.api";
import { Input } from "@/components/ui/input";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { formatOrderNumber } from "@/utils/orderNumber";
import { formatReturnReason, getPaymentType, orderStatusMatchesFilter } from "@/utils/orderDisplay";
import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";

const OrderModal = React.lazy(() =>
  import("../product/OrderModal").then((m) => ({ default: m.OrderModal }))
);

const ADMIN_ORDERS_CACHE_MS = 45 * 1000;

interface Address {
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  area?: string;
  postalCode: string;
  phone: string;
  line1: string;
}

interface Order {
  _id: string;
  id?: string;
  orderNumber?: number;
  customerName: string;
  address: Address;
  phoneNumber: string;
  items: { name: string; quantity: number; price: number }[];
  type: string;
  bill: number;
  payment: string;
  paymentStatus?: string;
  paymentMethod?: string;
  status: string;
  returnReason?: string;
  returnedBy?: "user" | "admin";
  createdAt: string;
}

function normalizeOrders(data: unknown): Order[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: unknown })?.data)
      ? ((data as { data: Order[] }).data)
      : [];
  return list.map((o: Order) => ({ ...o, id: o._id }));
}

export default function OrdersTable() {
  const { formatMoney } = useStoreCurrency();
  const cachedOrders = getCachedData<Order[]>(CACHE_KEYS.ADMIN_ORDERS);
  const [orders, setOrders] = useState<Order[]>(() =>
    Array.isArray(cachedOrders) ? cachedOrders : []
  );
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(() =>
    Array.isArray(cachedOrders) ? cachedOrders : []
  );
  const [loading, setLoading] = useState(() => !cachedOrders?.length);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState<"All" | "cancel" | "complete" | "Returned">("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const openView = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const loadOrders = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const data = await fetchOrders();
      const mapped = normalizeOrders(data);
      setOrders(mapped);
      setFilteredOrders(mapped);
      setCachedData(CACHE_KEYS.ADMIN_ORDERS, mapped, ADMIN_ORDERS_CACHE_MS);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasCache = (getCachedData<Order[]>(CACHE_KEYS.ADMIN_ORDERS)?.length ?? 0) > 0;
    void loadOrders({ silent: hasCache });
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let data = [...orders];

    if (selectedTab !== "All") {
      data = data.filter((order) => orderStatusMatchesFilter(order.status, selectedTab));
    }

    if (search.trim() !== "") {
      const s = search.toLowerCase();
      data = data.filter(
        (order) =>
          order.customerName.toLowerCase().includes(s) ||
          order.phoneNumber.toLowerCase().includes(s) ||
          (order.orderNumber != null && String(order.orderNumber).includes(s)) ||
          formatOrderNumber(order.orderNumber, order._id).toLowerCase().includes(s)
      );
    }

    setFilteredOrders(data);
  }, [orders, selectedTab, search]);

  const getColumns = () => {
    const allColumns = [
      {
        name: "SR",
        cell: (_row: Order, index: number) => <span className="text-gray-600">{index + 1}</span>,
        minWidth: "56px",
        width: "56px",
        grow: 0,
      },
      {
        name: "Order",
        cell: (row: Order) => (
          <button
            type="button"
            onClick={() => openView(row)}
            className="font-semibold theme-text-primary hover:underline truncate max-w-full"
            title={formatOrderNumber(row.orderNumber, row._id)}
          >
            {formatOrderNumber(row.orderNumber, row._id)}
          </button>
        ),
        minWidth: "88px",
        width: "100px",
        grow: 0,
      },
      {
        name: "Customer",
        heading: (row: Order) => row.customerName,
        subInfo: (row: Order) => row.phoneNumber,
        minWidth: "140px",
        grow: 1,
      },
      {
        name: "Address",
        cell: (row: Order) => {
          const address = row.address
            ? `${row.address.line1}, ${row.address.area || ""}, ${row.address.city}, ${row.address.province}`
            : "N/A";
          return (
            <div className="py-1 min-w-0 max-w-full overflow-hidden">
              <div className="text-sm text-gray-900 line-clamp-2 break-words" title={address}>
                {address}
              </div>
            </div>
          );
        },
        minWidth: "150px",
        grow: 1,
      },
      {
        name: "Items",
        cell: (row: Order) => {
          const itemsText = row.items.map((i) => `${i.name} x ${i.quantity}`).join(", ");
          return (
            <div className="py-1 min-w-0 max-w-full overflow-hidden">
              <div className="font-medium text-gray-900 truncate" title={itemsText}>
                {itemsText}
              </div>
              <div className="text-sm text-gray-500 truncate" title={row.type}>
                {row.type}
              </div>
            </div>
          );
        },
        minWidth: "150px",
        grow: 1,
      },
      {
        name: "Bill",
        heading: (row: Order) => formatMoney(row.bill),
        subInfo: (row: Order) => getPaymentType(row),
        minWidth: "100px",
        width: "110px",
        grow: 0,
      },
      {
        name: "Payment",
        cell: (row: Order) => (
          <StatusBadge status={row.paymentStatus || "Pending"} type="payment" />
        ),
        minWidth: "100px",
        width: "110px",
        grow: 0,
      },
      {
        name: "Status",
        cell: (row: Order) => {
          const returnText = formatReturnReason(row);
          return (
            <div className="py-1 space-y-1 min-w-0 max-w-full overflow-hidden">
              <StatusBadge status={row.status} type="order" />
              {returnText && (
                <p className="text-[11px] text-amber-900 max-w-full line-clamp-2" title={returnText}>
                  {returnText}
                </p>
              )}
            </div>
          );
        },
        minWidth: "120px",
        grow: 0,
      },
      {
        name: "Created At",
        cell: (row: Order) => new Date(row.createdAt).toLocaleDateString(),
        minWidth: "100px",
        width: "110px",
        grow: 0,
      },
    ];

    if (windowWidth < 640) {
      return allColumns.filter((_, idx) => [0, 1, 2, 6, 7].includes(idx));
    }

    if (windowWidth < 786) {
      return allColumns.filter((_, idx) => [0, 1, 2, 6, 7].includes(idx));
    }

    if (windowWidth < 800) {
      return allColumns.filter((_, idx) => [0, 1, 2, 6, 7].includes(idx));
    }

    if (windowWidth < 1024) {
      return allColumns.filter((_, idx) => [0, 1, 2, 4, 6, 7].includes(idx));
    }

    if (windowWidth < 1250) {
      return allColumns.filter((_, idx) => [0, 1, 2, 3, 4, 6, 7].includes(idx));
    }

    return allColumns;
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
        <div className="flex gap-4 items-center flex-wrap min-w-0">
          <h2 className="text-2xl font-semibold theme-heading">Orders</h2>
          <FilterTabs
            tabs={[
              { id: "All", label: "All" },
              { id: "cancel", label: "Cancel" },
              { id: "complete", label: "Complete" },
              { id: "Returned", label: "Returned" },
            ]}
            activeTab={selectedTab}
            onTabChange={(tabId) => setSelectedTab(tabId as any)}
          />
        </div>

        <div className="w-full md:w-auto mt-2 md:mt-0">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 text-gray-900"
            style={{ borderColor: "var(--theme-primary)" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-primary)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--theme-primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--theme-primary)";
              e.currentTarget.style.boxShadow = "";
            }}
          />
        </div>
      </div>

      {modalOpen && (
        <React.Suspense fallback={null}>
          <OrderModal
            order={selectedOrder}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onUpdate={() => loadOrders({ silent: true })}
          />
        </React.Suspense>
      )}

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden w-full max-w-full min-w-0">
        {loading && orders.length === 0 ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} />
          </div>
        ) : (
          <EnhancedDataTable<Order>
            columns={getColumns()}
            data={filteredOrders}
            onView={openView}
            pagination
          />
        )}
      </div>
    </div>
  );
}
