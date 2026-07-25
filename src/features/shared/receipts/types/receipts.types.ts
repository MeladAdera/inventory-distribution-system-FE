export interface ReceiptItem {
  id: number;
  inventory_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
  quantity_before: number;
  quantity_after: number;
}

export interface Receipt {
  id: number;
  shop_id: number;
  created_by: number;
  notes: string | null;
  is_free: boolean;
  is_cancelled: boolean;
  /** Cancel metadata — detail endpoint only, null while the receipt is active */
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancel_reason: string | null;
  created_at: string;
  total_price: number;
  items: ReceiptItem[];
}

export interface ReceiptListItem {
  id: number;
  shop_id: number;
  shop_name: string;
  created_by: number;
  created_by_name: string;
  total_items: number;
  notes: string | null;
  is_free: boolean;
  is_cancelled: boolean;
  created_at: string;
}

export interface CreateReceiptItem {
  inventoryId: number;
  quantity: number;
}

export interface CreateReceiptInput {
  items: CreateReceiptItem[];
  notes?: string;
}

export interface CancelReceiptInput {
  /** Optional, max 500 chars — omitted entirely when the user leaves it blank */
  reason?: string;
}

export const CANCEL_REASON_MAX_LENGTH = 500;

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  shopId?: number;
  createdBy?: number;
  fromDate?: string;
  toDate?: string;
}
