// Debts (deferred payment). Shared by both portals: a debt is the same object
// whether it came from an order (warehouse → shop) or a receipt (shop → customer).
//
// Money is ALWAYS a string ("50.00"), never a number. Parsing these into JS
// floats for arithmetic produces 0.30000000000000004 and a balance that is
// wrong by a fraction of a unit — use the minor-unit helpers in
// `src/common/utils/money.ts` instead.

/** Who owes the money. */
export enum DebtorType {
  /** A shop owes the warehouse — created when an order ships unpaid. */
  SHOP = 'SHOP',
  /** A customer owes a shop — created by a partial-payment receipt. */
  CUSTOMER = 'CUSTOMER',
}

/**
 * Always derived server-side from paid_amount vs total_amount — never set directly.
 * It can move backwards: reversing a payment takes PAID → PARTIAL, or PARTIAL → OPEN.
 */
export enum DebtStatus {
  OPEN = 'OPEN',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  OTHER = 'OTHER',
}

/**
 * Age of a debt, measured from `created_at`.
 * ⚠️ `60+` must reach the server URL-encoded as `60%2B` — a raw `+` decodes to a
 * space and silently matches nothing. Axios's default serializer handles this.
 */
export enum AgingBucket {
  RECENT = '0-30',
  LATE = '31-60',
  OVERDUE = '60+',
}

export interface Debt {
  id: number;
  creditor_shop_id: number;
  debtor_type: DebtorType;
  /** Set when debtor_type is SHOP. */
  debtor_shop_id: number | null;
  /** Set when debtor_type is CUSTOMER. */
  customer_id: number | null;
  /** The order this debt came from, when debtor_type is SHOP. */
  order_id: number | null;
  /** The receipt this debt came from, when debtor_type is CUSTOMER. */
  receipt_id: number | null;
  total_amount: string;
  paid_amount: string;
  status: DebtStatus;
  /** Reserved for a future version — nothing sets it yet. Ignore it. */
  due_date: string | null;
  note: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  /** total_amount - paid_amount, computed server-side. */
  remaining: string;
}

/**
 * A row from GET /debts. `debtor_name` already resolves to the shop or customer
 * name — render one column, don't branch on `debtor_type` in the UI.
 */
export interface DebtListItem extends Debt {
  debtor_name: string;
  creditor_shop_name: string;
}

/**
 * One row of a debt's ledger. Reversals are appended as a NEGATIVE amount rather
 * than deleting the original, so history shows both.
 *
 * GET /debts/:id/payments returns these as a plain array (not paginated),
 * ordered by paid_at ASC then id ASC.
 */
export interface DebtPayment {
  id: number;
  debt_id: number;
  amount: string;
  method: PaymentMethod;
  /** True on a reversal row, false on a collection. */
  is_reversal: boolean;
  /** The payment this row undoes — set only on reversal rows, null otherwise. */
  reverses_payment_id: number | null;
  note: string | null;
  /** When the money moved. This is the ordering key, not created_at. */
  paid_at: string;
  created_by: number;
  created_at: string;
}

/**
 * A ledger row with its reversal state resolved.
 *
 * The original payment carries no "reversed" flag of its own — the only way to
 * know is that some other row in the array points back at it. Deriving it once
 * here keeps that scan out of the components.
 */
export interface DebtPaymentRow extends DebtPayment {
  isReversed: boolean;
}

/**
 * One entry of the array returned by POST /customers/:id/payments. A single FIFO
 * payment can settle several debts at once, so this is always rendered as a list
 * of "what this payment settled" — never a single confirmation toast.
 */
export interface PaymentApplication {
  debt_id: number;
  receipt_id: number | null;
  amount: string;
  status: DebtStatus;
  remaining: string;
}

export interface DebtsSummary {
  total_billed: string;
  total_collected: string;
  total_remaining: string;
  open_count: number;
  /**
   * Money collected on a debt whose sale was later cancelled — now owed back.
   * v1 only reports it; there is no endpoint to process a refund, so surface it
   * as a flagged line item, never a button.
   */
  refund_due: string;
}

/**
 * A shop's ledger has three sides, reported separately and never netted against
 * each other — they answer different questions and are owed to different people.
 *
 * `owed_by_shop` and `owed_to_suppliers` are both money going out, but they are
 * still not additive: one is owed to the warehouse for orders, the other to
 * local suppliers the shop found itself.
 */
export interface ShopDebtSummary {
  shop_id: number;
  /** To the warehouse, for orders. */
  owed_by_shop: DebtsSummary;
  /** From this shop's credit customers. */
  owed_to_shop: DebtsSummary;
  /** To this shop's own suppliers, for bills. */
  owed_to_suppliers: DebtsSummary;
}

/** Always exactly 3 rows, even at count 0 — safe to map straight onto a 3-bar chart. */
export interface AgingRow {
  bucket: AgingBucket;
  count: number;
  /** The REMAINING balance in this bucket, not the original sale value. */
  amount: string;
}

export interface DebtListParams {
  page?: number;
  limit?: number;
  status?: DebtStatus;
  debtorType?: DebtorType;
  /** Admin only — filter by debtor shop. */
  shopId?: number;
  customerId?: number;
  /** Implies "still owed", so combining it with status=PAID returns nothing. */
  agingBucket?: AgingBucket;
  fromDate?: string;
  toDate?: string;
}

/** Filters for the receivables report — same shape as the list, minus pagination. */
export type ReceivablesParams = Omit<DebtListParams, 'page' | 'limit'>;

/** Body for POST /orders/:id/payments. */
export interface RecordPaymentInput {
  amount: string;
  method?: PaymentMethod;
  /** Max 500 chars. */
  note?: string;
}

/** Body for POST /debts/:id/payments/:paymentId/reverse. */
export interface ReversePaymentInput {
  reason?: string;
}

export const PAYMENT_NOTE_MAX_LENGTH = 500;
export const REVERSE_REASON_MAX_LENGTH = 500;
