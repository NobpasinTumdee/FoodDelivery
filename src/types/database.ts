export type Role = 'admin' | 'user';
export type DeliveryRoundStatus = 'OPEN' | 'CLOSED' | 'DELIVERED';
export type ProductCategory = 'SNACK' | 'RICE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface Customer {
  id: string; // UUID from auth.users
  nickname: string | null;
  phone: string | null;
  delivery_address: string | null;
  profile_picture: string | null;
  points: number; // default 0
  role: Role; // default 'user'
  created_at: string;
}

export interface DeliveryRound {
  id: number;
  round_name: string;
  cutoff_time: string;
  delivery_date: string;
  status: DeliveryRoundStatus; // default 'OPEN'
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: ProductCategory | null;
  base_price: number;
  image_url: string | null;
  detail: string | null;
  is_active: boolean; // default true
  created_at: string;
}

export interface Addon {
  id: number;
  product_id: number;
  name: string;
  image_url: string | null;
  price: number; // default 0
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: string | null; // UUID from customers
  delivery_round_id: number;
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  total_amount: number;
  discount_amount: number; // default 0
  net_amount: number;
  payment_status: PaymentStatus; // default 'PENDING'
  payment_slip_url: string | null;
  order_status: OrderStatus; // default 'PENDING'
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderItemAddon {
  id: string; // UUID
  order_item_id: number;
  addon_name: string;
  addon_price: number;
  created_at: string;
}
