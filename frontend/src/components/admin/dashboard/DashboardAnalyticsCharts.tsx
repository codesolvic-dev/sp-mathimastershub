import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardCategoryPoint,
  DashboardOrderStatus,
  DashboardTrendPoint,
} from "@/api/dashboard.api";
import { getOrderStatusStyles } from "@/utils/orderDisplay";

function useThemeColor() {
  const [themeColor, setThemeColor] = useState("#8B5E3C");

  useEffect(() => {
    const update = () => {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--theme-primary")
        .trim();
      if (color) setThemeColor(color);
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    return () => observer.disconnect();
  }, []);

  return themeColor;
}

const PIE_COLORS = [
  "#F97316",
  "#3B82F6",
  "#6366F1",
  "#14B8A6",
  "#22C55E",
  "#15803D",
  "#EF4444",
  "#B45309",
  "#9CA3AF",
];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 h-full">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "8px 12px",
};

export function OrdersTrendChart({
  data,
  title,
}: {
  data: DashboardTrendPoint[];
  title?: string;
}) {
  const themeColor = useThemeColor();

  return (
    <ChartCard title={title || "Orders Trend (Last 6 Months)"}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke={themeColor}
              fill={themeColor}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function RevenueTrendChart({
  data,
  formatMoney,
  title,
}: {
  data: DashboardTrendPoint[];
  formatMoney: (amount: number) => string;
  title?: string;
}) {
  const themeColor = useThemeColor();

  return (
    <ChartCard title={title || "Revenue Trend (Last 6 Months)"}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatMoney(Number(value || 0)), "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={themeColor}
              strokeWidth={2}
              dot={{ r: 4, fill: themeColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function OrderStatusPieChart({ data }: { data: DashboardOrderStatus[] }) {
  const chartData = data.filter((item) => item.count > 0);

  return (
    <ChartCard title="Orders by Status">
      <div className="h-64">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No order data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={
                      PIE_COLORS[index % PIE_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chartData.map((item) => (
          <span
            key={item.status}
            className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusStyles(item.status)}`}
          >
            {item.status}: {item.count}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

export function ProductsByCategoryChart({ data }: { data: DashboardCategoryPoint[] }) {
  const themeColor = useThemeColor();

  return (
    <ChartCard title="Products by Category">
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No category data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: "#6b7280", fontSize: 11 }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Products" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={themeColor} fillOpacity={0.85 - index * 0.05} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
