export interface Address {
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  area?: string;
  postalCode: string;
  phone: string;
  line1: string;
}

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
  discountAmount?: number;
  lineTotal?: number;
  lineTotalAfterDiscount?: number;
  image?: string;
}

export interface Order {
  _id: string;
  orderNumber?: number;
  customerName: string;
  address: Address;
  phoneNumber: string;
  items: OrderItem[];
  subtotal?: number;
  productDiscount?: number;
  deliveryFee?: number;
  type: string;
  bill: number;
  payment: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status: string;
  cancelledBy?: "user" | "admin";
  cancelledAt?: string;
  cancellationReason?: string;
  returnedBy?: "user" | "admin";
  returnedAt?: string;
  returnReason?: string;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: string;
}
