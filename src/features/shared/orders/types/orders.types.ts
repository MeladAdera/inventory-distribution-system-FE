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

// One order is the same row on both sides of the system: the shop calls it "my
// order", the warehouse calls it a transfer. `@/features/shared/transfers` aliases
// these types rather than redeclaring them — this file is the single definition.
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
  /** Omitted by `GET /orders` — only the detail endpoint returns line items. */
  items?: OrderItem[];
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  shop_id?: number; // admin only — filter by destination shop (to_shop_id)
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItem[];
  /** Admin only — the destination shop. A shop owner's own shop is inferred from the token. */
  shopId?: number;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

/**
 * The backend enforces strict sequential transitions, so always send the immediate
 * next status — skipping a step returns 400.
 *
 * SHIPPED is deliberately absent: only the shop may confirm delivery
 * (SHIPPED → RECEIVED), so the warehouse has no next step to offer there.
 */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]: OrderStatus.SHIPPED,
  [OrderStatus.RECEIVED]: OrderStatus.COMPLETED,
};
