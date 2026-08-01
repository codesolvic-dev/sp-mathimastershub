import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Search, Truck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/ui/StatusBadge";
import { spacing } from "@/utils/spacing";
import { trackOrderPublic } from "@/api/order.api";
import { formatOrderNumber } from "@/utils/orderNumber";
import { normalizeOrderStatus } from "@/utils/orderDisplay";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";

const TRACK_STEPS = [
  "Pending",
  "Order Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Completed",
] as const;

type TrackedOrder = {
  _id: string;
  orderNumber?: number | null;
  status?: string;
  createdAt?: string;
  bill?: number;
  payment?: string;
  itemCount?: number;
  items?: { name: string; quantity: number; image?: string }[];
  shippingCity?: string;
  shippingProvince?: string;
};

function getTrackStepIndex(status?: string): number {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "Cancelled" || normalized === "Returned" || normalized === "Refunded") {
    return -1;
  }
  const idx = TRACK_STEPS.findIndex((step) => step === normalized);
  return idx >= 0 ? idx : 0;
}

export default function TrackOrderPage() {
  const { formatMoney } = useStoreCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("id") || searchParams.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);

  const runTrack = async (value: string) => {
    const cleaned = value.trim().replace(/^#/, "");
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setOrder(null);
    setSearchParams({ id: cleaned }, { replace: true });

    try {
      const data = await trackOrderPublic(cleaned);
      setOrder(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Order not found");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial.trim()) {
      runTrack(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runTrack(query);
  };

  const stepIndex = order ? getTrackStepIndex(order.status) : -1;
  const terminalStatus = order
    ? ["Cancelled", "Returned", "Refunded"].includes(String(normalizeOrderStatus(order.status)))
    : false;

  const destination = useMemo(() => {
    if (!order) return "";
    return [order.shippingCity, order.shippingProvince].filter(Boolean).join(", ");
  }, [order]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />
      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1`}>
        <section className="w-full">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-start gap-4 mb-6">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold theme-heading">Track Order</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Enter any order number or order ID to view live delivery status. No login required.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5 mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order number / Order ID
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 1001 or #1001"
                  className="flex-1 bg-white"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  className="theme-button h-10 px-6 rounded-md inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? "Tracking…" : "Track Order"}
                </button>
              </div>
            </form>

            {searched && !loading && error && !order ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5">
                <p className="font-medium text-red-700">Order not found</p>
                <p className="text-sm text-red-600 mt-1">
                  {error === "Order not found"
                    ? "Please check the order number and try again."
                    : error}
                </p>
              </div>
            ) : null}

            {order ? (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatOrderNumber(order.orderNumber, order._id)}
                    </p>
                    {order.createdAt ? (
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    ) : null}
                    {typeof order.bill === "number" ? (
                      <p className="text-sm text-gray-700 mt-1">
                        Total: {formatMoney(order.bill)}
                      </p>
                    ) : null}
                    {destination ? (
                      <p className="text-sm text-gray-600 mt-1">Shipping to: {destination}</p>
                    ) : null}
                    {order.payment ? (
                      <p className="text-sm text-gray-600 mt-1">Payment: {order.payment}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={order.status || "Pending"} type="order" />
                </div>

                <div className="px-5 sm:px-6 py-5">
                  {terminalStatus ? (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-5">
                      <p className="text-sm text-gray-800">
                        This order is marked as{" "}
                        <strong>{normalizeOrderStatus(order.status)}</strong>. Tracking steps are
                        closed for this status.
                      </p>
                    </div>
                  ) : (
                    <ol className="space-y-0 mb-2">
                      {TRACK_STEPS.map((step, index) => {
                        const done = index <= stepIndex;
                        const current = index === stepIndex;
                        return (
                          <li key={step} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                  done
                                    ? "text-white border-transparent"
                                    : "bg-white text-gray-400 border-gray-300"
                                }`}
                                style={done ? { backgroundColor: "var(--theme-primary)" } : {}}
                              >
                                {done ? <Check size={16} /> : <span className="text-xs">{index + 1}</span>}
                              </div>
                              {index < TRACK_STEPS.length - 1 && (
                                <div
                                  className={`w-0.5 flex-1 min-h-6 ${
                                    done && index < stepIndex ? "" : "bg-gray-200"
                                  }`}
                                  style={
                                    done && index < stepIndex
                                      ? { backgroundColor: "var(--theme-primary)" }
                                      : undefined
                                  }
                                />
                              )}
                            </div>
                            <div className="pb-6">
                              <p
                                className={`text-sm font-medium ${
                                  current ? "text-gray-900" : "text-gray-700"
                                }`}
                              >
                                {step}
                              </p>
                              {current ? (
                                <p className="text-xs text-gray-500 mt-0.5">Current status</p>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {order.items && order.items.length > 0 ? (
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Items ({order.itemCount || order.items.length})
                      </h3>
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li
                            key={`${item.name}-${idx}`}
                            className="flex items-center justify-between gap-3 text-sm text-gray-700"
                          >
                            <span className="truncate">{item.name}</span>
                            <span className="shrink-0 text-gray-500">×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!searched && !loading ? (
              <p className="text-sm text-gray-500 text-center py-6">
                Enter an order number above to view tracking details.
              </p>
            ) : null}
          </div>
        </section>
      </main>
      <section className={`w-full ${spacing.footer.gapTop}`} style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Footer />
      </section>
    </div>
  );
}
