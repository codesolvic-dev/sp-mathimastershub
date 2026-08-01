import React, { useEffect, useState } from "react";
import EnhancedDataTable from "../../../pages/admin/components/table/EnhancedDataTable";
import { DataTableSkeleton } from "@/components/ui/TableSkeleton";
import { getAllReviews, deleteReview, updateReviewStatus } from "../../../api/review.api";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import { Star } from "lucide-react";

interface Review {
  _id: string;
  userId: string | {
    _id: string;
    name: string;
    email: string;
  };
  type?: "product" | "store";
  productId?: string | {
    _id: string;
    name: string;
    image1?: string;
  };
  productName?: string;
  orderId?: string;
  rating: number;
  comment: string;
  status?: "active" | "inactive";
  createdAt: string;
}

export default function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setReviews(
        Array.isArray(data)
          ? data.map((r) => ({
              ...r,
              status: r.status === "inactive" ? "inactive" : "active",
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching reviews:", err);
      error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = (reviewId: string) => {
    setDeleteConfirm(reviewId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteReview(deleteConfirm);
      success("Review deleted successfully");
      setDeleteConfirm(null);
      loadReviews();
    } catch (err: any) {
      error(err.message || "Failed to delete review");
      setDeleteConfirm(null);
    }
  };

  const handleStatusToggle = async (review: Review) => {
    if (!review._id) return;
    const nextStatus = review.status === "active" ? "inactive" : "active";
    const previous = reviews;

    setReviews((current) =>
      current.map((item) =>
        item._id === review._id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await updateReviewStatus(review._id, nextStatus);
      success(`Review ${nextStatus === "active" ? "activated" : "deactivated"}`);
    } catch (err: any) {
      setReviews(previous);
      error(err?.response?.data?.message || err?.message || "Failed to update review status");
    }
  };

  const getColumns = () => {
    return [
      {
        name: "Type / Product",
        heading: (row: Review) =>
          row.type === "store"
            ? "Store Review"
            : row.productName || (typeof row.productId === "object" ? row.productId?.name : "N/A"),
        subInfo: (row: Review) => new Date(row.createdAt).toLocaleDateString(),
        minWidth: "200px",
      },
      {
        name: "Customer",
        heading: (row: Review) => (typeof row.userId === 'object' ? row.userId?.name : "Unknown"),
        subInfo: (row: Review) => (typeof row.userId === 'object' ? row.userId?.email : ""),
        minWidth: "200px",
      },
      {
        name: "Rating",
        cell: (row: Review) => (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= row.rating ? "fill-[var(--theme-primary)] text-[var(--theme-primary)]" : "text-gray-300"}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">({row.rating}/5)</span>
          </div>
        ),
        minWidth: "200px",
      },
      {
        name: "Comment",
        cell: (row: Review) => (
          <div className="max-w-xs">
            <p className="text-sm text-gray-900 line-clamp-2">{row.comment}</p>
          </div>
        ),
        minWidth: "300px",
      },
      {
        name: "Status",
        cell: (row: Review) => (
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
  };

  return (
    <div className="w-full max-w-full min-w-0">
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold mb-6 theme-heading">Reviews</h2>
      </div>

      <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <DataTableSkeleton rows={8} />
          </div>
        ) : (
          <EnhancedDataTable<Review & { id?: string }>
            columns={getColumns()}
            data={reviews.map(r => ({ ...r, id: r._id }))}
            onDelete={(row) => handleDelete((row as any)._id || row.id || '')}
            pagination
          />
        )}
      </div>
    </div>
  );
}
