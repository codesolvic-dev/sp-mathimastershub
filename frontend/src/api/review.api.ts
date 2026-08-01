import API from "./axios";

export type ReviewType = "product" | "store";
export type ReviewStatus = "active" | "inactive";

export interface Review {
  _id: string;
  userId: string;
  type?: ReviewType;
  productId?: string;
  productName?: string;
  orderId?: string;
  rating: number;
  comment: string;
  status?: ReviewStatus;
  createdAt: string;
}

export interface CreateReviewData {
  type?: ReviewType;
  productId?: string;
  productName?: string;
  orderId?: string;
  rating: number;
  comment: string;
}

// Create review
export const createReview = async (data: CreateReviewData) => {
  const res = await API.post("/reviews", data);
  return res.data;
};

// Get user's reviews
export const getUserReviews = async (): Promise<Review[]> => {
  const res = await API.get("/reviews/my-reviews");
  return res.data.data;
};

// Get product reviews (public)
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const res = await API.get(`/reviews/product/${productId}`);
  return res.data.data;
};

export interface PublicReview {
  _id: string;
  type?: ReviewType;
  userId?: { _id: string; name?: string } | string | null;
  productId?: { _id: string; name?: string; image1?: string } | string | null;
  productName?: string;
  rating: number;
  comment: string;
  status?: ReviewStatus;
  createdAt: string;
}

// Get all public reviews (store + product) for the Reviews page
export const getPublicReviews = async (): Promise<PublicReview[]> => {
  const res = await API.get("/reviews/public");
  return res.data.data;
};

// Get all reviews (admin only)
export const getAllReviews = async (): Promise<Review[]> => {
  const res = await API.get("/reviews");
  return res.data.data;
};

export const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
  const res = await API.patch(`/reviews/${reviewId}/status`, { status });
  return res.data.data;
};

// Delete review (admin only)
export const deleteReview = async (reviewId: string) => {
  const res = await API.delete(`/reviews/${reviewId}`);
  return res.data;
};
