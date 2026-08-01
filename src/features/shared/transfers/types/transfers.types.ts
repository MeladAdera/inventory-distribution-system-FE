// A "transfer" is an order. The admin portal shipped under the transfer name while
// the shop portal used order, but both read and write the same `/orders` resource,
// so these are aliases onto the canonical types — not a second model.
//
// Kept as aliases rather than renamed outright so the admin components can migrate
// in their own commit instead of one sweeping rename.
export {
  OrderStatus as TransferStatus,
  NEXT_STATUS,
} from '@/features/shared/orders/types/orders.types';

export type {
  Order as Transfer,
  OrderItem as TransferItem,
  OrderListParams as TransferListParams,
  CreateOrderItem as TransferOrderItem,
  CreateOrderInput as CreateTransferInput,
  UpdateOrderStatusInput as UpdateTransferStatusInput,
} from '@/features/shared/orders/types/orders.types';

/** UI-only: seeds the create-transfer modal from the shortages page. */
export interface TransferPrefill {
  productId?: number;
  quantity?: number;
  shopId?: number;
}
