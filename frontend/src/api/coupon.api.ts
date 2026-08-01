import API from "./axios";

export const getCoupons = async () => {
  const res = await API.get("/coupons");
  return res.data.data;
};

export const getCoupon = async (id: string) => {
  const res = await API.get(`/coupons/${id}`);
  return res.data.data;
};

export const createCoupon = async (couponData: any) => {
  const res = await API.post("/coupons", couponData);
  return res.data.data;
};

export const updateCoupon = async (id: string, couponData: any) => {
  const res = await API.put(`/coupons/${id}`, couponData);
  return res.data.data;
};

export const deleteCoupon = async (id: string) => {
  const res = await API.delete(`/coupons/${id}`);
  return res.data.data;
};

export const validateCoupon = async (validateData: {
  code: string;
  userId?: string;
  cartItems?: Array<{ productId: string; price: number; quantity: number }>;
}) => {
  const res = await API.post("/coupons/validate", validateData);
  return res.data.data;
};
