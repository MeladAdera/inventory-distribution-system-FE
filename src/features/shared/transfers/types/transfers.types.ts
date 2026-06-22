export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TransferItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Transfer {
  id: number;
  from_shop_id: number;
  to_shop_id: number;
  to_shop_name?: string;
  status: TransferStatus;
  total_items: number;
  total_price?: number;
  created_at: string;
  updated_at: string;
  items?: TransferItem[];
}

export interface TransferListParams {
  page?: number;
  limit?: number;
  status?: TransferStatus;
  shop_id?: number;
}

export interface TransferOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateTransferInput {
  items: TransferOrderItem[];
  shopId?: number;
}

export interface UpdateTransferStatusInput {
  status: TransferStatus;
}

export const NEXT_STATUS: Partial<Record<TransferStatus, TransferStatus>> = {
  [TransferStatus.PENDING]: TransferStatus.PROCESSING,
  [TransferStatus.PROCESSING]: TransferStatus.SHIPPED,
  [TransferStatus.RECEIVED]: TransferStatus.COMPLETED,
};

export interface TransferPrefill {
  productId?: number;
  quantity?: number;
  shopId?: number;
}
