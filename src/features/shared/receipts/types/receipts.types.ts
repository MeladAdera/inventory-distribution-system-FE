import type { DebtStatus } from '@/features/shared/debts/types/debts.types';

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

/**
 * The debt a credit sale created, returned inline on the receipt so a partial
 * payment needs no second request. `null` on a normal, fully-paid cash sale.
 */
export interface ReceiptDebt {
  id: number;
  total_amount: string;
  paid_amount: string;
  remaining: string;
  status: DebtStatus;
}

export interface Receipt {
  id: number;
  shop_id: number;
  created_by: number;
  notes: string | null;
  is_free: boolean;
  is_cancelled: boolean;
  /** Set only when the sale was made on credit to a known customer. */
  customer_id: number | null;
  customer_name: string | null;
  debt: ReceiptDebt | null;
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
  /**
   * Who owes the balance. Required whenever `paidAmount` is less than the total —
   * omitting it returns 400 receipt.CUSTOMER_REQUIRED.
   */
  customerId?: number;
  /**
   * Money string. Omit for a normal fully-paid sale; "0.00" sells entirely on
   * credit. Greater than the total returns 400 receipt.PAID_EXCEEDS_TOTAL.
   */
  paidAmount?: string;
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
