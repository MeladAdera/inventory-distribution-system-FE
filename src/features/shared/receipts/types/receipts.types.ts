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
  /** The drawer this sale belongs to. Null when it was rung up with no shift open. */
  shift_session_id: number | null;
  /** Echo of the idempotency key the client sent. Null for receipts predating it. */
  client_receipt_id: string | null;
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
  /**
   * A UUID minted once per sale and reused on every retry of that same sale.
   * Sending it twice returns the original receipt instead of writing a second one.
   *
   * Required rather than optional on purpose. POST /receipts commits the receipt,
   * its items, the stock movement and any debt in one transaction — so a lost
   * response (slow connection, timeout, offline replay) leaves a retry that rings
   * the whole sale up again. The duplicate is complete and self-consistent, which
   * is what makes it dangerous: nothing looks broken, the shop is just short of
   * stock. This is not an offline-only concern; a normal online sale on a bad
   * connection fails in exactly the same way.
   */
  clientReceiptId: string;
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

/**
 * Which slice of the loaded page a receipts toolbar is showing.
 *
 * All three are applied client-side. `GET /receipts` filters by shop and date
 * range only, so those narrow on the server and these narrow what is on screen —
 * both portals report the two counts side by side so the gap is never hidden.
 */
export enum ReceiptView {
  ALL = 'ALL',
  THIS_WEEK = 'THIS_WEEK',
  WITH_NOTES = 'WITH_NOTES',
}

/**
 * Headline figures for a receipts page. Never page-scoped, and always scoped to
 * what the caller may see: a shop owner's `/receipts` is their own shop, an
 * admin's is every shop.
 */
export interface ReceiptStats {
  /** Every receipt on record, cancelled ones included. */
  total: number;
  /** Receipts raised since the start of this week, cancellations excluded. */
  thisWeek: number;
  /** Line items consumed, cancellations excluded — they put the stock back. */
  itemsConsumed: number;
  /** Distinct shops that have raised a receipt. Always 1 for a shop owner. */
  activeShops: number;
  /** ISO timestamp of the newest receipt, or null when there are none. */
  lastReceiptAt: string | null;
}
