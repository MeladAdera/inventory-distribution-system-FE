export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  from_shop_id: number;
  to_shop_id: number;
  to_shop_name?: string;
  status: OrderStatus;
  total_items: number;
  total_price?: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItem[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}
