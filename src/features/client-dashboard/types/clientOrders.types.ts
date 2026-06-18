import { OrderStatus } from '@/features/orders/types/orders.types';

export interface ClientOrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
}

export interface ClientOrder {
  id: number;
  status: OrderStatus;
  total_items: number;
  created_at: string;
  items: ClientOrderItem[];
}

export type ClientStatusFilter = 'ALL' | OrderStatus;
