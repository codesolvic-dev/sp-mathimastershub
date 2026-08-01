import React, { useState, useEffect } from "react";
import { Order } from "@/types/Order";
import { updateOrderStatus, getOrderById } from "@/api/order.api";
import { useToast } from "@/components/ui/toast";
import { useStoreCurrency } from "@/contexts/StoreCurrencyContext";
import { formatOrderNumber } from "@/utils/orderNumber";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  formatReturnReason,
  getPaymentType,
  normalizeOrderStatus,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/utils/orderDisplay";

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ order, open, onClose, onUpdate }) => {
  const { success, error } = useToast();
  const { formatMoney } = useStoreCurrency();
  const [status, setStatus] = useState(order?.status || "Pending");
  const [paymentStatus, setPaymentStatus] = useState(order?.paymentStatus || "Pending");
  const [returnReason, setReturnReason] = useState(order?.returnReason || "");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [returnReasonError, setReturnReasonError] = useState("");
  const [fetchingOrder, setFetchingOrder] = useState(false);

  useEffect(() => {
    if (open && order?._id) {
      setFetchingOrder(true);
      getOrderById(order._id)
        .then((freshOrder) => {
          setCurrentOrder(freshOrder);
          setStatus(normalizeOrderStatus(freshOrder.status || "Pending"));
          setPaymentStatus(freshOrder.paymentStatus || "Pending");
          setReturnReason(freshOrder.returnReason || "");
        })
        .catch((err) => {
          console.error("Failed to fetch fresh order data:", err);
          setCurrentOrder(order);
          setStatus(normalizeOrderStatus(order?.status || "Pending"));
          setPaymentStatus(order?.paymentStatus || "Pending");
          setReturnReason(order?.returnReason || "");
        })
        .finally(() => {
          setFetchingOrder(false);
        });
    } else if (order) {
      setCurrentOrder(order);
      setStatus(normalizeOrderStatus(order.status || "Pending"));
      setPaymentStatus(order.paymentStatus || "Pending");
      setReturnReason(order.returnReason || "");
    }
  }, [open, order?._id]);

  if (!open || !currentOrder) return null;

  const paymentType = getPaymentType(currentOrder);
  const formattedReturnReason = formatReturnReason(currentOrder);
  const isCancelled =
    normalizeOrderStatus(currentOrder.status) === "Cancelled";
  const isReturned =
    normalizeOrderStatus(currentOrder.status) === "Returned";

  const handleSave = async () => {
    if (loading) return;

    if (!status) {
      setStatusError("Status is required");
      return;
    }

    if (status === "Returned" && !returnReason.trim()) {
      setReturnReasonError("Return reason is required");
      return;
    }

    setLoading(true);
    setStatusError("");
    setReturnReasonError("");
    try {
      await updateOrderStatus(currentOrder._id, status, {
        returnReason: status === "Returned" ? returnReason.trim() : undefined,
        paymentStatus,
      });
      success("Order updated successfully!");
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error(err);
      error(err?.response?.data?.message || err?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 text-black">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 theme-heading text-gray-900">Order Details</h2>

        {fetchingOrder ? (
          <div className="text-center py-4">
            <p className="text-gray-900">Loading order details...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-900">
              <strong>Order:</strong>{" "}
              <span className="font-semibold theme-text-primary">
                {formatOrderNumber(currentOrder.orderNumber, currentOrder._id)}
              </span>
            </p>
            <p className="text-gray-900"><strong>Customer:</strong> {currentOrder.customerName}</p>
            <p className="text-gray-900"><strong>Phone:</strong> {currentOrder.phoneNumber}</p>
            <p className="text-gray-900">
              <strong>Address:</strong>{" "}
              {currentOrder.address
                ? `${currentOrder.address.line1 || ""}${currentOrder.address.area ? ", " + currentOrder.address.area : ""}, ${currentOrder.address.city || ""}, ${currentOrder.address.province || ""}, ${currentOrder.address.postalCode || ""}`
                : "No address provided"}
            </p>
            <p className="text-gray-900"><strong>Items:</strong> {currentOrder.items.map(i => `${i.name} x ${i.quantity}`).join(", ")}</p>
            <div className="mt-3 space-y-1 text-sm border-t pt-3">
              <p className="text-gray-900 flex justify-between gap-4">
                <strong>Subtotal:</strong>
                <span>{formatMoney(Number(currentOrder.subtotal || 0))}</span>
              </p>
              {Number(currentOrder.productDiscount || 0) > 0 && (
                <p className="text-green-700 flex justify-between gap-4">
                  <strong>Product Discount:</strong>
                  <span>-{formatMoney(Number(currentOrder.productDiscount || 0))}</span>
                </p>
              )}
              {Number(currentOrder.deliveryFee || 0) > 0 && (
                <p className="text-gray-900 flex justify-between gap-4">
                  <strong>Delivery Fee:</strong>
                  <span>{formatMoney(Number(currentOrder.deliveryFee || 0))}</span>
                </p>
              )}
              {currentOrder.couponCode && (
                <p className="text-purple-700 flex justify-between gap-4">
                  <strong>Coupon ({currentOrder.couponCode}):</strong>
                  <span>-{formatMoney(Number(currentOrder.couponDiscount || 0))}</span>
                </p>
              )}
              <p className="text-gray-900 flex justify-between gap-4 font-semibold border-t pt-2">
                <strong>Total:</strong>
                <span>{formatMoney(currentOrder.bill)}</span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <strong className="text-gray-900">Payment Type:</strong>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                {paymentType}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <strong className="text-gray-900">Payment Status:</strong>
              <StatusBadge status={currentOrder.paymentStatus || "Pending"} type="payment" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <strong className="text-gray-900">Order Status:</strong>
              <StatusBadge status={currentOrder.status} type="order" />
            </div>
            <p className="text-gray-900 mt-2"><strong>Order Date:</strong> {new Date(currentOrder.createdAt).toLocaleString()}</p>

            {isCancelled && (
              <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Cancelled by:{" "}
                      <span className="font-bold">
                        {currentOrder.cancelledBy === "admin"
                          ? "Admin"
                          : currentOrder.cancelledBy === "user"
                            ? "Customer"
                            : "Customer"}
                      </span>
                    </p>
                    {currentOrder.cancellationReason && (
                      <p className="text-sm text-red-800 mt-1">{currentOrder.cancellationReason}</p>
                    )}
                    {currentOrder.cancelledAt && (
                      <p className="text-xs text-red-700 mt-1">
                        Cancelled on: {new Date(currentOrder.cancelledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(isReturned || formattedReturnReason) && (
              <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-700 text-lg">↩</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Return Details</p>
                    <p className="text-sm text-amber-900 mt-1">
                      {formattedReturnReason || `Return by (User) - ${returnReason}`}
                    </p>
                    {currentOrder.returnedAt && (
                      <p className="text-xs text-amber-800 mt-1">
                        Returned on: {new Date(currentOrder.returnedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block mb-1 text-gray-900">Order Status:</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (statusError) setStatusError("");
                if (e.target.value !== "Returned" && returnReasonError) setReturnReasonError("");
              }}
              className={`border rounded p-2 w-full text-black ${statusError ? "border-red-500" : ""}`}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {statusError && <p className="text-red-500 text-xs mt-1">{statusError}</p>}
          </div>

          {status === "Returned" && (
            <div>
              <label className="block mb-1 text-gray-900">Return Reason:</label>
              <textarea
                value={returnReason}
                onChange={(e) => {
                  setReturnReason(e.target.value);
                  if (returnReasonError) setReturnReasonError("");
                }}
                rows={3}
                placeholder="Why is this order being returned?"
                className={`border rounded p-2 w-full text-black resize-none ${returnReasonError ? "border-red-500" : ""}`}
              />
              {returnReasonError && <p className="text-red-500 text-xs mt-1">{returnReasonError}</p>}
            </div>
          )}

          <div>
            <label className="block mb-1 text-gray-900">Payment Status:</label>
            <select
              value={
                paymentStatus === "Paid"
                  ? "Received"
                  : paymentStatus === "Refunded"
                    ? "Refund"
                    : paymentStatus
              }
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="border rounded p-2 w-full text-black"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button className="px-4 h-12 bg-gray-200 rounded text-black" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button
            className="px-4 h-12 text-white rounded theme-button flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loading}
          >
            {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
