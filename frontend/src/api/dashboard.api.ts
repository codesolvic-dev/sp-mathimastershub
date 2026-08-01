import API from "./axios";

export type DashboardOrderStatus = {
  status: string;
  count: number;
};

export type DashboardTrendPoint = {
  month: string;
  key: string;
  orders: number;
  revenue: number;
};

export type DashboardCategoryPoint = {
  name: string;
  count: number;
};

export type DashboardTopCustomer = {
  rank: number;
  customerName: string;
  email: string;
  phoneNumber: string;
  orderCount: number;
  totalSpent: number;
};

export type DashboardDateRange = {
  fromDate: string | null;
  toDate: string | null;
  filtered: boolean;
  trendGranularity?: "day" | "month";
};

export type DashboardAnalytics = {
  totalItems: number;
  activeItems: number;
  totalCategories: number;
  totalCustomers: number;
  registeredUsers: number;
  revenue: number;
  completedSales: number;
  totalOrders: number;
  ordersPending: number;
  complete: number;
  cancel: number;
  returned: number;
  orderStatusBreakdown: DashboardOrderStatus[];
  ordersTrend: DashboardTrendPoint[];
  productsByCategory: DashboardCategoryPoint[];
  topCustomers: DashboardTopCustomer[];
  productViews: number;
  productShares: number;
  blogViews: number;
  websiteVisitors: number;
  websiteVisitorsAllTime?: number;
  dateRange?: DashboardDateRange;
};

export type DashboardStatsParams = {
  fromDate?: string;
  toDate?: string;
};

export const getDashboardStats = async (
  params?: DashboardStatsParams
): Promise<DashboardAnalytics> => {
  const query: Record<string, string> = {};
  if (params?.fromDate) query.fromDate = params.fromDate;
  if (params?.toDate) query.toDate = params.toDate;
  const res = await API.get("/dashboard", { params: query });
  return res.data.data;
};
