// API
export { ordersApi } from './api/orders.api';

// Hooks — the live list/mutate hook is useTransfers in @/features/shared/transfers,
// which reads the same /orders resource.

// Types
export type {
  Order,
  OrderItem,
  CreateOrderInput,
  CreateOrderItem,
  UpdateOrderStatusInput,
  OrderListParams,
} from './types/orders.types';
export { OrderStatus, NEXT_STATUS } from './types/orders.types';

// Validations
export { createOrderSchema, updateOrderStatusSchema } from './validations/orders.schema';
