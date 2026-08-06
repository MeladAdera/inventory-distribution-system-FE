import { OrderStatus } from '@/features/shared/orders/types/orders.types';

export interface ClientOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface ClientOrder {
  id: number;
  status: OrderStatus;
  total_items: number;
  total_price?: number;
  created_at: string;
  items: ClientOrderItem[];
}

export type ClientStatusFilter = 'ALL' | OrderStatus;

/**
 * The four groups a shop actually thinks in, rather than the six statuses the
 * warehouse moves an order through. They partition every status exactly once,
 * so switching between them can never hide a row.
 */
export enum OrderView {
  ALL = 'ALL',
  /** Placed, being packed, or on its way. */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Delivered — received, or received and closed off. */
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export const ORDER_VIEW_STATUSES: Record<Exclude<OrderView, OrderView.ALL>, OrderStatus[]> = {
  [OrderView.IN_PROGRESS]: [OrderStatus.PENDING, OrderStatus.PROCESSING, OrderStatus.SHIPPED],
  [OrderView.DONE]: [OrderStatus.RECEIVED, OrderStatus.COMPLETED],
  [OrderView.CANCELLED]: [OrderStatus.CANCELLED],
};

/** Headline figures for the orders page, over every order the shop has placed. */
export interface ClientOrderStats {
  total: number;
  inProgress: number;
  /**
   * Shipped but not yet confirmed. The only figure here the shop can act on —
   * confirming is what moves the stock into their inventory.
   */
  awaitingConfirmation: number;
  /** ISO timestamp of the most recent order, or null when there are none. */
  lastOrderAt: string | null;
}
