import { OrderStatus } from '@/features/auth/types/enums';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  shopId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  shopId: string;
  items: OrderItem[];
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  items?: OrderItem[];
}
