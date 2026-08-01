import type { DashboardTopCustomer } from "@/api/dashboard.api";

type TopCustomersPanelProps = {
  customers: DashboardTopCustomer[];
  formatMoney: (amount: number) => string;
};

export default function TopCustomersPanel({ customers, formatMoney }: TopCustomersPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full min-h-0 max-h-[420px] xl:max-h-full">
      <div className="px-5 py-4 border-b border-gray-100 shrink-0">
        <h3 className="text-base font-semibold text-gray-900">Top Customers</h3>
        <p className="text-xs text-gray-500 mt-1">Customers ranked by number of orders</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        {customers.length === 0 ? (
          <p className="text-sm text-gray-500 p-5">No customer orders yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <li key={`${customer.rank}-${customer.customerName}-${customer.phoneNumber}`} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: "var(--theme-light, #faf5f0)",
                      color: "var(--theme-primary, #8B5E3C)",
                    }}
                  >
                    {customer.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{customer.customerName}</p>
                    {customer.email ? (
                      <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                    ) : customer.phoneNumber ? (
                      <p className="text-xs text-gray-500 truncate">{customer.phoneNumber}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-600">
                        <span className="font-semibold text-gray-900">{customer.orderCount}</span> orders
                      </span>
                      <span className="text-green-700 font-medium shrink-0">
                        {formatMoney(customer.totalSpent)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
