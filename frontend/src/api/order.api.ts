import API from "./axios"; // your configured axios instance

export const fetchOrders = async () => {
  const res = await API.get("/orders"); // backend endpoint
  return res.data;
};
export const createOrder = async (orderData: any) => {
  const res = await API.post("/orders/create", orderData);
  return res.data;
};

export const getOrderById = async (orderId: string) => {
  const res = await API.get(`/orders/${orderId}`);
  return res.data;
};

/** Public: track order by number or id (no login required). */
export const trackOrderPublic = async (ref: string) => {
  const cleaned = String(ref || "").trim().replace(/^#/, "");
  const res = await API.get(`/orders/track/${encodeURIComponent(cleaned)}`);
  return res.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: string,
  extra?: { returnReason?: string; paymentStatus?: string }
) => {
  const res = await API.patch(`/orders/${orderId}/status`, { status, ...extra });
  return res.data;
};

export const updateOrderPaymentStatus = async (orderId: string, paymentStatus: string) => {
  const res = await API.patch(`/orders/${orderId}/payment-status`, { paymentStatus });
  return res.data;
};
