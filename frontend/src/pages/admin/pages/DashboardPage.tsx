// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import SalesChart from "../../../components/admin/dashboard/SalesChart";
// import {
//   ExternalLink,
//   FolderTree,
//   Package,
//   ShoppingCart,
//   Users,
//   DollarSign,
// } from "lucide-react";
// import { getCatalogTypes } from "@/api/catalogtype.api";
// import { getBlogStats } from "@/api/blog.api";
// import { getApplications } from "@/api/application.api";
// import { getDashboardStats, type DashboardAnalytics } from "@/api/dashboard.api";
// import PageLoader from "@/components/ui/PageLoader";
// import StatusBadge from "@/components/ui/StatusBadge";
// import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
// import {
//   OrdersTrendChart,
//   OrderStatusPieChart,
//   ProductsByCategoryChart,
//   RevenueTrendChart,
// } from "@/components/admin/dashboard/DashboardAnalyticsCharts";
// import TopCustomersPanel from "@/components/admin/dashboard/TopCustomersPanel";

// interface CatalogTypeCard {
//   _id: string;
//   slug: string;
//   label: string;
//   published: number;
//   total: number;
//   href: string;
// }

// export default function DashboardPage() {
//   const { formatMoney } = useStoreCurrency();
//   const [catalogCards, setCatalogCards] = useState<CatalogTypeCard[]>([]);
//   const [stats, setStats] = useState<DashboardAnalytics | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadDashboardData = async () => {
//       try {
//         setLoading(true);

//         const [types, apiStats] = await Promise.all([
//           getCatalogTypes().catch(() => []),
//           getDashboardStats().catch(() => null),
//         ]);

//         const cards: CatalogTypeCard[] = [];
//         if (types && Array.isArray(types)) {
//           const processedCards = await Promise.all(
//             types.map(async (t: { _id: string; slug: string; label: string }) => {
//               const data = await getBlogStats(t.slug).catch(() => ({
//                 published: 0,
//                 totalBlogs: 0,
//               }));
//               return {
//                 _id: t._id,
//                 slug: t.slug,
//                 label: t.label,
//                 published: data?.published ?? 0,
//                 total: data?.totalBlogs ?? 0,
//                 href: `/admin/catalog/${t.slug}`,
//               };
//             })
//           );
//           cards.push(...processedCards);
//         }

//         const hasApplicationsType = cards.some((card) => card.slug === "applications");
//         if (!hasApplicationsType) {
//           const apps = await getApplications("all").catch(() => []);
//           const list = Array.isArray(apps) ? apps : [];
//           cards.push({
//             _id: "applications",
//             slug: "applications",
//             label: "Applications",
//             published: list.filter((a: any) => String(a?.status || "").toLowerCase() === "published").length,
//             total: list.length,
//             href: "/admin/applications",
//           });
//         }
//         setCatalogCards(cards);

//         if (apiStats) {
//           setStats(apiStats);
//         }
//       } catch (error) {
//         console.error("Failed to load dashboard data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadDashboardData();
//   }, []);

//   if (loading) {
//     return <PageLoader />;
//   }

//   const orderStatuses = stats?.orderStatusBreakdown || [];

//   return (
//     <div className="p-4 sm:p-6 md:p-8 space-y-8">
//       <style>{`
//         .dashboard-card {
//           background: #ffffff !important;
//           border: 1px solid #f3f4f6 !important;
//           border-radius: 1rem !important;
//           padding: 1.5rem !important;
//           position: relative !important;
//           overflow: hidden !important;
//           box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
//         }
//         .dashboard-card:hover {
//           transform: translateY(-4px) !important;
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03) !important;
//         }
//         .dashboard-card-title {
//           color: #6B7280 !important;
//           font-size: 0.875rem !important;
//           font-weight: 500 !important;
//           text-transform: uppercase !important;
//           letter-spacing: 0.05em !important;
//           margin-bottom: 0.5rem !important;
//         }
//         .dashboard-card-value {
//           color: #111827 !important;
//           font-size: 1.875rem !important;
//           font-weight: 700 !important;
//           font-family: 'Poppins', sans-serif !important;
//           line-height: 2.25rem !important;
//         }
//         .dashboard-card-desc {
//           color: #9CA3AF !important;
//           font-size: 0.75rem !important;
//           margin-top: 1rem !important;
//           display: flex !important;
//           align-items: center !important;
//           gap: 0.25rem !important;
//         }
//         .dashboard-card-desc-highlight {
//           color: var(--theme-primary) !important;
//           font-weight: 600 !important;
//         }
//         .dashboard-card-desc-highlight-green {
//           color: #10B981 !important;
//           font-weight: 600 !important;
//         }
//         .dashboard-status-label {
//           color: #6B7280 !important;
//           font-size: 0.6875rem !important;
//           font-weight: 500 !important;
//           text-transform: uppercase !important;
//           letter-spacing: 0.025em !important;
//         }
//         .dashboard-status-value {
//           font-size: 0.875rem !important;
//           font-weight: 600 !important;
//           margin-top: 0.125rem !important;
//         }
//         .dashboard-status-complete {
//           color: #10B981 !important;
//         }
//         .dashboard-status-cancel {
//           color: #EF4444 !important;
//         }
//         .dashboard-status-returned {
//           color: #F59E0B !important;
//         }
//         .dashboard-icon-wrapper {
//           padding: 0.75rem !important;
//           border-radius: 0.75rem !important;
//           transition: transform 0.3s ease !important;
//           display: flex !important;
//           align-items: center !important;
//           justify-content: center !important;
//         }
//         .dashboard-card:hover .dashboard-icon-wrapper {
//           transform: scale(1.1) !important;
//         }
//         .dashboard-icon-primary {
//           background-color: var(--theme-light) !important;
//         }
//         .dashboard-icon-primary svg {
//           stroke: var(--theme-primary) !important;
//         }
//         .dashboard-icon-green {
//           background-color: #ECFDF5 !important;
//         }
//         .dashboard-icon-green svg {
//           stroke: #10B981 !important;
//         }
//         .dashboard-icon-blue {
//           background-color: #EFF6FF !important;
//         }
//         .dashboard-icon-blue svg {
//           stroke: #3B82F6 !important;
//         }
//       `}</style>

//       <h1 className="text-2xl font-semibold theme-heading mb-6">Dashboard</h1>

//       {/* Original metrics grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <div className="dashboard-card">
//           <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 transition-all duration-500" style={{ background: "radial-gradient(circle, var(--theme-light) 0%, transparent 70%)" }} />
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="dashboard-card-title">Total Items</p>
//               <h3 className="dashboard-card-value">{stats?.totalItems}</h3>
//             </div>
//             <div className="dashboard-icon-wrapper dashboard-icon-primary">
//               <Package className="w-6 h-6" />
//             </div>
//           </div>
//           <div className="dashboard-card-desc">
//             <span className="dashboard-card-desc-highlight">{stats?.activeItems ?? 0} active</span> in catalog inventory
//           </div>
//         </div>

//         <div className="dashboard-card">
//           <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 transition-all duration-500" style={{ background: "radial-gradient(circle, var(--theme-light) 0%, transparent 70%)" }} />
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="dashboard-card-title">Total Customers</p>
//               <h3 className="dashboard-card-value">{stats?.totalCustomers}</h3>
//             </div>
//             <div className="dashboard-icon-wrapper dashboard-icon-primary">
//               <Users className="w-6 h-6" />
//             </div>
//           </div>
//           <div className="dashboard-card-desc">
//             <span className="dashboard-card-desc-highlight">Registered Users</span> with profile access
//           </div>
//         </div>

//         <div className="dashboard-card">
//           <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 transition-all duration-500" style={{ background: "radial-gradient(circle, #ECFDF5 0%, transparent 70%)" }} />
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="dashboard-card-title">Revenue</p>
//               <h3 className="dashboard-card-value truncate max-w-[170px]" title={formatMoney(stats?.revenue ?? 0)}>
//                 {formatMoney(stats?.revenue ?? 0)}
//               </h3>
//             </div>
//             <div className="dashboard-icon-wrapper dashboard-icon-green">
//               <DollarSign className="w-6 h-6" />
//             </div>
//           </div>
//           <div className="dashboard-card-desc">
//             <span className="dashboard-card-desc-highlight-green">Completed Sales</span> from paid orders
//           </div>
//         </div>

//         <div className="dashboard-card">
//           <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-6 -mt-6 transition-all duration-500" style={{ background: "radial-gradient(circle, #EFF6FF 0%, transparent 70%)" }} />
//           <div className="flex items-center justify-between mb-3">
//             <div>
//               <p className="dashboard-card-title">Total Orders</p>
//               <h3 className="dashboard-card-value">{stats?.totalOrders}</h3>
//             </div>
//             <div className="dashboard-icon-wrapper dashboard-icon-blue">
//               <ShoppingCart className="w-6 h-6" />
//             </div>
//           </div>
//           <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100 mt-2">
//             <div className="flex flex-col">
//               <span className="dashboard-status-label">Complete</span>
//               <span className="dashboard-status-value dashboard-status-complete">{stats?.complete}</span>
//             </div>
//             <div className="flex flex-col">
//               <span className="dashboard-status-label">Cancel</span>
//               <span className="dashboard-status-value dashboard-status-cancel">{stats?.cancel}</span>
//             </div>
//             <div className="flex flex-col">
//               <span className="dashboard-status-label">Returned</span>
//               <span className="dashboard-status-value dashboard-status-returned">{stats?.returned}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Catalog overview – one card per catalog type (published count) */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium theme-heading">Catalog overview</h2>
//         {catalogCards.length === 0 ? (
//           <p className="text-gray-500">No catalog types yet. Create one in Developer → Catalog Types.</p>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
//             {catalogCards.map((card) => (
//               <Link
//                 key={card._id}
//                 to={card.href}
//                 className="flex rounded-lg p-4 items-center justify-between text-white shadow-sm transition hover:opacity-90"
//                 style={{ backgroundColor: "var(--theme-dark)" }}
//               >
//                 <div className="min-w-0 flex-1">
//                   <p className="text-sm opacity-80 mb-1 truncate">{card.label}</p>
//                   <p className="text-2xl font-semibold">
//                     {card.published} <span className="text-sm font-normal opacity-80">published</span>
//                   </p>
//                   {card.total > 0 && (
//                     <p className="text-xs opacity-70 mt-0.5">{card.total} total</p>
//                   )}
//                 </div>
//                 <ExternalLink className="w-5 h-5 shrink-0 opacity-80 ml-2" />
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       <div className="w-full pt-2">
//         <SalesChart catalogData={catalogCards.map((c) => ({ label: c.label, value: c.published }))} />
//       </div>

//       {/* Store analytics (new section — added below original dashboard) */}
//       <section className="space-y-6 pt-4 border-t border-gray-200">
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <h2 className="text-xl font-semibold theme-heading">Store Analytics</h2>
//           <div className="flex flex-wrap gap-2 text-sm">
//             <Link to="/admin/products" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
//               Products
//             </Link>
//             <Link to="/admin/categories" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
//               Categories
//             </Link>
//             <Link to="/admin/orders" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
//               Orders
//             </Link>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
//           <div className="dashboard-card">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="dashboard-card-title">Categories</p>
//                 <h3 className="dashboard-card-value">{stats?.totalCategories ?? 0}</h3>
//               </div>
//               <div className="dashboard-icon-wrapper bg-blue-50">
//                 <FolderTree className="w-5 h-5 text-blue-600" />
//               </div>
//             </div>
//           </div>
//           <div className="dashboard-card">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="dashboard-card-title">Pending Orders</p>
//                 <h3 className="dashboard-card-value">{stats?.ordersPending ?? 0}</h3>
//               </div>
//               <div className="dashboard-icon-wrapper bg-orange-50">
//                 <ShoppingCart className="w-5 h-5 text-orange-600" />
//               </div>
//             </div>
//           </div>
//           <div className="dashboard-card">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="dashboard-card-title">Active Items</p>
//                 <h3 className="dashboard-card-value">{stats?.activeItems ?? 0}</h3>
//               </div>
//               <div className="dashboard-icon-wrapper dashboard-icon-primary">
//                 <Package className="w-5 h-5" />
//               </div>
//             </div>
//           </div>
//           <div className="dashboard-card">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="dashboard-card-title">Registered Users</p>
//                 <h3 className="dashboard-card-value">{stats?.registeredUsers ?? 0}</h3>
//               </div>
//               <div className="dashboard-icon-wrapper dashboard-icon-primary">
//                 <Users className="w-5 h-5" />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
//           <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
//             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Status Overview</h3>
//             <span className="text-xs text-gray-500">{stats?.totalOrders ?? 0} total orders</span>
//           </div>
//           <div className="flex flex-wrap gap-2">
//             {orderStatuses.length === 0 ? (
//               <span className="text-sm text-gray-500">No orders yet</span>
//             ) : (
//               orderStatuses.map((item) => (
//                 <div key={item.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
//                   <StatusBadge status={item.status} type="order" />
//                   <span className="text-sm font-semibold text-gray-900">{item.count}</span>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//           <div className="xl:col-span-2 space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <OrdersTrendChart data={stats?.ordersTrend || []} />
//               <RevenueTrendChart data={stats?.ordersTrend || []} formatMoney={formatMoney} />
//             </div>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <OrderStatusPieChart data={stats?.orderStatusBreakdown || []} />
//               <ProductsByCategoryChart data={stats?.productsByCategory || []} />
//             </div>
//           </div>
//           <div className="xl:col-span-1">
//             <TopCustomersPanel customers={stats?.topCustomers || []} formatMoney={formatMoney} />
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }


























// New Dashboard






import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Eye,
  Share2,
  FileText,
  Globe,
  Calendar,
} from "lucide-react";
import { getDashboardStats, type DashboardAnalytics } from "@/api/dashboard.api";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import TopCustomersPanel from "@/components/admin/dashboard/TopCustomersPanel";
import { CACHE_KEYS, getCachedData, setCachedData } from "@/utils/cache";

const DashboardCharts = React.lazy(() =>
  import("@/components/admin/dashboard/DashboardAnalyticsCharts").then((m) => ({
    default: function LazyDashboardCharts({
      ordersTrend,
      orderStatusBreakdown,
      productsByCategory,
      formatMoney,
      ordersTrendTitle,
      revenueTrendTitle,
    }: {
      ordersTrend: DashboardAnalytics["ordersTrend"];
      orderStatusBreakdown: DashboardAnalytics["orderStatusBreakdown"];
      productsByCategory: DashboardAnalytics["productsByCategory"];
      formatMoney: (n: number) => string;
      ordersTrendTitle?: string;
      revenueTrendTitle?: string;
    }) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <m.OrdersTrendChart data={ordersTrend || []} title={ordersTrendTitle} />
          <m.RevenueTrendChart
            data={ordersTrend || []}
            formatMoney={formatMoney}
            title={revenueTrendTitle}
          />
          <m.OrderStatusPieChart data={orderStatusBreakdown || []} />
          <m.ProductsByCategoryChart data={productsByCategory || []} />
        </div>
      );
    },
  }))
);

const DASHBOARD_CACHE_MS = 90 * 1000;

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { formatMoney } = useStoreCurrency();
  const cachedStats = getCachedData<DashboardAnalytics>(CACHE_KEYS.DASHBOARD_STATS);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const isFiltered = !!(appliedFrom || appliedTo);
  const [stats, setStats] = useState<DashboardAnalytics | null>(
    isFiltered ? null : cachedStats
  );
  const [loading, setLoading] = useState(!cachedStats || isFiltered);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const filtered = !!(appliedFrom || appliedTo);
    const loadDashboardData = async () => {
      try {
        setRefreshing(true);
        const apiStats = await getDashboardStats({
          fromDate: appliedFrom || undefined,
          toDate: appliedTo || undefined,
        });
        if (cancelled) return;
        setStats(apiStats);
        if (!filtered) {
          setCachedData(CACHE_KEYS.DASHBOARD_STATS, apiStats, DASHBOARD_CACHE_MS);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [appliedFrom, appliedTo]);

  const applyDateFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      setAppliedFrom(toDate);
      setAppliedTo(fromDate);
      setFromDate(toDate);
      setToDate(fromDate);
      return;
    }
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFrom("");
    setAppliedTo("");
  };

  const orderStatuses = stats?.orderStatusBreakdown || [];
  const rangeLabel =
    appliedFrom && appliedTo
      ? `${formatDisplayDate(appliedFrom)} – ${formatDisplayDate(appliedTo)}`
      : appliedFrom
        ? `From ${formatDisplayDate(appliedFrom)}`
        : appliedTo
          ? `Until ${formatDisplayDate(appliedTo)}`
          : "";
  const isDailyTrend = stats?.dateRange?.trendGranularity === "day";
  const ordersTrendTitle = isFiltered
    ? isDailyTrend
      ? "Orders Trend (Daily)"
      : "Orders Trend (Monthly)"
    : undefined;
  const revenueTrendTitle = isFiltered
    ? isDailyTrend
      ? "Revenue Trend (Daily)"
      : "Revenue Trend (Monthly)"
    : undefined;

  return (
    <div className="space-y-6">
      <style>{`
        .dashboard-card {
          background: #ffffff !important;
          border: 1px solid #f3f4f6 !important;
          border-radius: 1rem !important;
          padding: 1.25rem !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.3s ease !important;
        }
        .dashboard-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.08) !important;
        }
        .dashboard-card-title {
          color: #6B7280 !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .dashboard-card-value {
          color: #111827 !important;
          font-size: 1.75rem !important;
          font-weight: 700 !important;
          font-family: 'Poppins', sans-serif !important;
          line-height: 2rem !important;
        }
        .dashboard-icon-wrapper {
          padding: 0.65rem !important;
          border-radius: 0.75rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .dashboard-status-label {
          color: #6B7280 !important;
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
        }
        .dashboard-status-value {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin-top: 0.125rem !important;
        }
        .dashboard-status-complete { color: #10B981 !important; }
        .dashboard-status-cancel { color: #EF4444 !important; }
        .dashboard-status-returned { color: #F59E0B !important; }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold theme-heading">Dashboard</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/admin/products" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            Products
          </Link>
          <Link to="/admin/categories" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            Categories
          </Link>
          <Link to="/admin/orders" className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            Orders
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mr-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            Date filter
          </div>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
          </label>
          <button
            type="button"
            onClick={applyDateFilter}
            disabled={!fromDate && !toDate}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            Apply
          </button>
          {isFiltered && (
            <button
              type="button"
              onClick={clearDateFilter}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
          {refreshing && (
            <span className="text-xs text-gray-500 self-center">Updating…</span>
          )}
        </div>
        {isFiltered && rangeLabel && (
          <p className="mt-2 text-xs text-gray-500">
            Showing store analytics for <span className="font-medium text-gray-700">{rangeLabel}</span>
          </p>
        )}
      </div>

      <section className="space-y-4" style={{ marginBottom: "20px" }}>
        <h2 className="text-lg font-semibold theme-heading">Website Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="dashboard-card-title">Product Views</p>
                <h3 className="dashboard-card-value">{(stats?.productViews ?? 0).toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Total product page views</p>
              </div>
              <div className="dashboard-icon-wrapper bg-violet-50">
                <Eye className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="dashboard-card-title">Blog Views</p>
                <h3 className="dashboard-card-value">{(stats?.blogViews ?? 0).toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Total blog post views</p>
              </div>
              <div className="dashboard-icon-wrapper bg-sky-50">
                <FileText className="w-5 h-5 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="dashboard-card-title">Product Shares</p>
                <h3 className="dashboard-card-value">{(stats?.productShares ?? 0).toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Times products were shared</p>
              </div>
              <div className="dashboard-icon-wrapper bg-amber-50">
                <Share2 className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="dashboard-card-title">Website Visitors</p>
                <h3 className="dashboard-card-value">{(stats?.websiteVisitors ?? 0).toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isFiltered
                    ? rangeLabel
                      ? `Visitors in ${rangeLabel}`
                      : "Visitors in selected range"
                    : "Unique sessions on storefront"}
                </p>
              </div>
              <div className="dashboard-icon-wrapper bg-emerald-50">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold theme-heading">Store Analytics</h2>
        {isFiltered && rangeLabel && (
          <span className="text-xs text-gray-500">{rangeLabel}</span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="dashboard-card-title">Items</p>
              <h3 className="dashboard-card-value">{stats?.totalItems ?? 0}</h3>
              <p className="text-xs text-gray-500 mt-1">{stats?.activeItems ?? 0} active</p>
            </div>
            <div className="dashboard-icon-wrapper" style={{ backgroundColor: "var(--theme-light)" }}>
              <Package className="w-5 h-5" style={{ color: "var(--theme-primary)" }} />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="dashboard-card-title">Categories</p>
              <h3 className="dashboard-card-value">{stats?.totalCategories ?? 0}</h3>
              <p className="text-xs text-gray-500 mt-1">Product categories</p>
            </div>
            <div className="dashboard-icon-wrapper bg-blue-50">
              <FolderTree className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="dashboard-card-title">Orders</p>
              <h3 className="dashboard-card-value">{stats?.totalOrders ?? 0}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {isFiltered
                  ? `${stats?.ordersPending ?? 0} pending in range`
                  : `${stats?.ordersPending ?? 0} pending`}
              </p>
            </div>
            <div className="dashboard-icon-wrapper bg-indigo-50">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100 mt-3">
            <div className="flex flex-col">
              <span className="dashboard-status-label">Complete</span>
              <span className="dashboard-status-value dashboard-status-complete">{stats?.complete ?? 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="dashboard-status-label">Cancel</span>
              <span className="dashboard-status-value dashboard-status-cancel">{stats?.cancel ?? 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="dashboard-status-label">Returned</span>
              <span className="dashboard-status-value dashboard-status-returned">{stats?.returned ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="dashboard-card-title">Revenue</p>
              <h3 className="dashboard-card-value truncate max-w-[160px]" title={formatMoney(stats?.revenue ?? 0)}>
                {formatMoney(stats?.revenue ?? 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isFiltered
                  ? `${stats?.totalCustomers ?? 0} customers in range`
                  : `${stats?.totalCustomers ?? 0} customers`}
              </p>
            </div>
            <div className="dashboard-icon-wrapper bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Order Status Overview</h2>
          <span className="text-xs text-gray-500">{stats?.totalOrders ?? 0} total orders</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {orderStatuses.length === 0 ? (
            <span className="text-sm text-gray-500">No orders yet</span>
          ) : (
            orderStatuses.map((item) => (
              <div key={item.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <StatusBadge status={item.status} type="order" />
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <React.Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 h-64 animate-pulse" />
                ))}
              </div>
            }
          >
            <DashboardCharts
              ordersTrend={stats?.ordersTrend || []}
              orderStatusBreakdown={stats?.orderStatusBreakdown || []}
              productsByCategory={stats?.productsByCategory || []}
              formatMoney={formatMoney}
              ordersTrendTitle={ordersTrendTitle}
              revenueTrendTitle={revenueTrendTitle}
            />
          </React.Suspense>
        </div>
        <div className="xl:col-span-1 relative min-h-[320px] xl:min-h-0">
          <div className="xl:absolute xl:inset-0 flex flex-col min-h-0">
            <TopCustomersPanel customers={stats?.topCustomers || []} formatMoney={formatMoney} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dashboard-card flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 uppercase">
              {isFiltered ? "Customers in Range" : "Registered Customers"}
            </p>
            <p className="text-lg font-bold text-gray-900">{stats?.totalCustomers ?? 0}</p>
          </div>
        </div>
        <div className="dashboard-card flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Completed Orders</p>
            <p className="text-lg font-bold text-gray-900">{stats?.complete ?? 0}</p>
          </div>
        </div>
        <div className="dashboard-card flex items-center gap-3">
          <Package className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-xs text-gray-500 uppercase">Cancelled / Returned</p>
            <p className="text-lg font-bold text-gray-900">
              {(stats?.cancel ?? 0) + (stats?.returned ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

