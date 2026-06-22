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
