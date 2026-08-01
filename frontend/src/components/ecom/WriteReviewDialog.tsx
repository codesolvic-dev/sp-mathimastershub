import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { createReview } from "@/api/review.api";
import { getUserOrders } from "@/api/user.api";
import { getProducts } from "@/api/product.api";
import CircularLoader from "@/components/ui/CircularLoader";
import type { Order } from "@/types/Order";
import { playCustomerSuccessSound } from "@/utils/notificationSound";

export type WriteReviewPreset = {
  productId?: string;
  productName?: string;
  orderId?: string;
};

type ReviewableItem = {
  productId: string;
  productName: string;
  orderId: string;
};

const REVIEWABLE_STATUSES = new Set(["Complete", "Completed", "Delivered"]);

function isReviewableOrder(status: string) {
  return REVIEWABLE_STATUSES.has(status);
}

function resolveProductId(
  item: { name: string; productId?: string; id?: string },
  products: Array<{ _id: string; name: string }>
): string | null {
  const direct = item.productId || item.id;
  if (direct) return String(direct);

  const byName = products.find((p) => p.name === item.name);
  return byName?._id ? String(byName._id) : null;
}

function buildPurchasedProductMap(
  orders: Order[],
  products: Array<{ _id: string; name: string }>
): Map<string, ReviewableItem> {
  const map = new Map<string, ReviewableItem>();

  for (const order of orders) {
    if (!isReviewableOrder(order.status)) continue;

    for (const item of order.items) {
      const productId = resolveProductId(item as { name: string; productId?: string; id?: string }, products);
      if (!productId || map.has(productId)) continue;

      map.set(productId, {
        productId,
        productName: item.name,
        orderId: order._id,
      });
    }
  }

  return map;
}

type WriteReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: WriteReviewPreset;
  /** Called after a review is submitted successfully. */
  onSubmitted?: () => void;
  /** Kept for backward compatibility; review type is now auto-detected from the page. */
  showAllProducts?: boolean;
};

export default function WriteReviewDialog({
  open,
  onOpenChange,
  preset,
  onSubmitted,
}: WriteReviewDialogProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ProductDetail page (/product/:id) => product review, everything else => store review
  const isProductReview = location.pathname.startsWith("/product/") && Boolean(preset?.productId);

  const [loading, setLoading] = useState(false);
  const [purchasedOrderId, setPurchasedOrderId] = useState<string | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productLabel = useMemo(() => preset?.productName ?? "", [preset?.productName]);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setComment("");
      setPurchasedOrderId(undefined);
      return;
    }

    if (!user || !isProductReview || !preset?.productId) return;

    // For product reviews, try to attach a delivered/completed order (optional).
    let cancelled = false;
    setLoading(true);

    Promise.all([getUserOrders(), getProducts({ activeOnly: true })])
      .then(([orders, products]) => {
        if (cancelled) return;

        const productList = products.map((p: { _id: string; name: string }) => ({
          _id: String(p._id),
          name: p.name,
        }));

        const purchasedMap = buildPurchasedProductMap(orders, productList);
        const purchased = purchasedMap.get(preset.productId as string);
        setPurchasedOrderId(purchased?.orderId ?? preset.orderId);
      })
      .catch(() => {
        if (!cancelled) setPurchasedOrderId(preset.orderId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user, isProductReview, preset?.productId, preset?.orderId]);

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/login", { state: { from: location.pathname } });
  };

  const handleSubmit = async () => {
    if (!user) {
      error("Please sign in to write a review");
      return;
    }

    if (rating === 0) {
      error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      error("Please write your review");
      return;
    }

    setSubmitting(true);
    try {
      if (isProductReview && preset?.productId) {
        await createReview({
          type: "product",
          productId: preset.productId,
          productName: preset.productName || productLabel,
          orderId: purchasedOrderId,
          rating,
          comment: comment.trim(),
        });
      } else {
        await createReview({
          type: "store",
          rating,
          comment: comment.trim(),
        });
      }

      success("Thank you! Your review has been submitted.");
      playCustomerSuccessSound();
      onSubmitted?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Failed to submit review";
      error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const dialogTitle = isProductReview ? "Write a Product Review" : "Write a Store Review";
  const dialogDescription = isProductReview
    ? "Share your experience with this product."
    : "Share your experience shopping with us.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-gray-900 border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold theme-heading">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-gray-500">{dialogDescription}</DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-sm text-gray-600">
              Sign in to rate your purchase and write a review.
            </p>
            <Button type="button" className="w-full theme-button" onClick={handleLogin}>
              Sign In
            </Button>
          </div>
        ) : loading ? (
          <div className="py-10 flex justify-center">
            <CircularLoader size={28} />
          </div>
        ) : (
          <div className="space-y-4">
            {isProductReview && productLabel ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product</label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50">
                  {productLabel}
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isProductReview
                    ? "Tell us what you liked about this product..."
                    : "Tell us about your overall shopping experience..."
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 theme-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
