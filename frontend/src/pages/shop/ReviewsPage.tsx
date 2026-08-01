import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Truck,
  Headphones,
  Lock,
  ThumbsUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WriteReviewDialog from "@/components/ecom/WriteReviewDialog";
import { getPublicReviews, type PublicReview } from "@/api/review.api";
import CircularLoader from "@/components/ui/CircularLoader";
import { spacing } from "@/utils/spacing";

type TabKey = "store" | "product";

const PAGE_SIZE = 6;

const TRUST_ITEMS = [
  { icon: Truck, label: "Fast Delivery" },
  { icon: CheckCircle2, label: "Original Products" },
  { icon: Headphones, label: "Friendly Support" },
  { icon: Lock, label: "Secure Payments" },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? "fill-current" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

function reviewerName(review: PublicReview): string {
  if (review.userId && typeof review.userId === "object") {
    return review.userId.name?.trim() || "Anonymous";
  }
  return "Anonymous";
}

function productLabel(review: PublicReview): string {
  if (review.productName) return review.productName;
  if (review.productId && typeof review.productId === "object") {
    return review.productId.name || "Product";
  }
  return "Product";
}

function ratingLabel(avg: number): string {
  if (avg >= 4.5) return "Excellent";
  if (avg >= 4) return "Very Good";
  if (avg >= 3) return "Good";
  if (avg >= 2) return "Fair";
  return "Poor";
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("store");
  const [page, setPage] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    getPublicReviews()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const storeReviews = useMemo(
    () => reviews.filter((r) => r.type === "store"),
    [reviews]
  );
  const productReviews = useMemo(
    () => reviews.filter((r) => r.type !== "store"),
    [reviews]
  );

  const activeList = tab === "store" ? storeReviews : productReviews;

  const overall = useMemo(() => {
    if (activeList.length === 0) return 0;
    const sum = activeList.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / activeList.length;
  }, [activeList]);

  const breakdown = useMemo(() => {
    const total = activeList.length;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = activeList.filter((r) => Math.round(r.rating) === stars).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, percent };
    });
  }, [activeList]);

  const recommendPercent = useMemo(() => {
    const total = activeList.length;
    if (total === 0) return 0;
    const positive = activeList.filter((r) => r.rating >= 4).length;
    return Math.round((positive / total) * 100);
  }, [activeList]);

  const topRatedProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; image?: string; sum: number; count: number }
    >();

    for (const r of productReviews) {
      const key =
        (r.productId && typeof r.productId === "object" ? r.productId._id : null) ||
        productLabel(r);
      const image =
        r.productId && typeof r.productId === "object" ? r.productId.image1 : undefined;
      const existing = map.get(key);
      if (existing) {
        existing.sum += r.rating || 0;
        existing.count += 1;
      } else {
        map.set(key, { name: productLabel(r), image, sum: r.rating || 0, count: 1 });
      }
    }

    return Array.from(map.values())
      .map((p) => ({ name: p.name, image: p.image, rating: p.sum / p.count, reviews: p.count }))
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 4);
  }, [productReviews]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const pagedReviews = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <WriteReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onSubmitted={loadReviews}
      />

      <main className={`${spacing.navbar.offset} ${spacing.navbar.gapBottom} flex-1 w-full`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {loading ? (
            <div className="py-24 flex justify-center">
              <CircularLoader size={36} />
            </div>
          ) : (
            <>
              {/* ============ TOP SUMMARY CARD ============ */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col items-start justify-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
                    <span className="text-sm font-medium text-gray-500">Overall Rating</span>
                    <div className="text-5xl font-bold text-gray-900 mt-1">
                      {overall.toFixed(1)}
                    </div>
                    <div className="mt-2">
                      <StarRow rating={overall} size={18} />
                    </div>
                    <span className="mt-2 text-sm font-semibold text-green-600">
                      {activeList.length > 0 ? ratingLabel(overall) : "No ratings yet"}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {activeList.length.toLocaleString()} Review
                      {activeList.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-2 lg:px-6">
                    {breakdown.map((row) => (
                      <div key={row.stars} className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-600 w-8 shrink-0">
                          {row.stars}{" "}
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-20 text-right shrink-0">
                          {row.count.toLocaleString()} ({row.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col justify-center gap-3 lg:pl-6 lg:border-l border-gray-100">
                    <div className="grid grid-cols-1 gap-2.5">
                      {TRUST_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <Icon size={16} className="text-green-600 shrink-0" />
                            {item.label}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2 flex items-center gap-2">
                      <span className="text-xl font-bold text-green-700">{recommendPercent}%</span>
                      <span className="text-xs text-green-700 leading-tight">
                        Customers Recommend This Store
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============ TABS ============ */}
              <div className="flex items-center gap-6 border-b border-gray-200 px-1">
                {(
                  [
                    { key: "store" as const, label: "Store Reviews", count: storeReviews.length },
                    { key: "product" as const, label: "Product Reviews", count: productReviews.length },
                  ]
                ).map((t) => {
                  const isActive = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`pb-3 text-sm border-b-2 transition-colors ${
                        isActive ? "font-semibold" : "font-medium text-gray-400 border-transparent"
                      }`}
                      style={
                        isActive
                          ? { color: "var(--theme-primary)", borderColor: "var(--theme-primary)" }
                          : {}
                      }
                    >
                      {t.label} ({t.count})
                    </button>
                  );
                })}
              </div>

              {/* ============ CONTENT GRID ============ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">
                      {tab === "store" ? "Store Reviews" : "Product Reviews"}{" "}
                      <span className="text-gray-400 font-normal">
                        ({activeList.length.toLocaleString()})
                      </span>
                    </h2>
                  </div>

                  {pagedReviews.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        No {tab === "store" ? "store" : "product"} reviews yet. Be the first to
                        write one!
                      </p>
                    </div>
                  ) : (
                    pagedReviews.map((review) => {
                      const name = reviewerName(review);
                      return (
                        <div
                          key={review._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{name}</span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={11} /> Verified Customer
                                </span>
                                {tab === "product" && (
                                  <span className="inline-flex items-center text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {productLabel(review)}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <StarRow rating={review.rating} />
                                <span className="text-xs text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                {review.comment}
                              </p>
                              {/* <button
                                type="button"
                                className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
                              >
                                <ThumbsUp size={13} /> Helpful
                              </button> */}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                            p === page
                              ? "text-white"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                          style={p === page ? { backgroundColor: "var(--theme-primary)" } : {}}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: top rated products */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Top Rated Products</h2>
                    <Link
                      to="/shop"
                      className="text-xs font-medium"
                      style={{ color: "var(--theme-primary)" }}
                    >
                      View all products
                    </Link>
                  </div>

                  {topRatedProducts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center text-sm text-gray-500">
                      No product reviews yet.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                      {topRatedProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4">
                          <img
                            src={product.image || "/product.png"}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <StarRow rating={product.rating} size={12} />
                              <span className="text-xs text-gray-500">
                                {product.rating.toFixed(1)} ({product.reviews})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ============ SUBMIT REVIEW BAR ============ */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  <Star size={16} className="fill-current" />
                  Write a Store Review
                </button>
                <p className="text-xs text-gray-400 text-center sm:text-left">
                  Your review will be public and visible to other shoppers.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <section
        className={`w-full ${spacing.footer.gapTop}`}
        style={{ marginBottom: 0, paddingBottom: 0 }}
      >
        <Footer />
      </section>
    </div>
  );
}
