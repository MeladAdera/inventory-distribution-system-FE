// Suppliers — the businesses a shop buys stock from on credit.
//
// The mirror of Customers: a customer owes the shop money (a receivable), a
// supplier is owed money BY the shop (a payable). Same CRUD, same filters, same
// FIFO payment endpoint — only the direction of the money differs.
//
// Unlike Customers, a WAREHOUSE_ADMIN reaches this feature too: the warehouse
// buys from its own distribution centers exactly as a shop buys from its local
// suppliers, scoped to its own shop id. Neither role gets a cross-shop view.
//
// That is why this sits in features/shared rather than features/shop — both
// portals mount the very same page, at /suppliers and /client/suppliers.

import type {
  CreditorType,
  DebtorType,
  DebtStatus,
  DebtsSummary,
} from '@/features/shared/debts/types/debts.types';

export interface Supplier {
  id: number;
  shop_id: number;
  name: string;
  /** Optional, but unique per shop among ACTIVE suppliers — a removed one frees its number. */
  phone: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Bills on this supplier's account that still carry a balance. */
  open_debts_count: number;
  /** Money string ("25.00") — what the shop still owes. Never parse for arithmetic. */
  total_remaining: string;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  /** Matches name or phone. */
  search?: string;
  /** Only suppliers still owed money. */
  hasDebt?: boolean;
  /** Include deactivated suppliers — hidden by default. */
  includeInactive?: boolean;
}

/**
 * Which slice of the list the toolbar is showing. `REMOVED` widens the list to
 * include deactivated suppliers rather than narrowing it to only those — the API
 * offers `includeInactive`, not an "inactive only" filter, and faking one
 * client-side would make the row count disagree with the pagination.
 */
export enum SupplierView {
  ALL = 'ALL',
  HAS_DEBT = 'HAS_DEBT',
  REMOVED = 'REMOVED',
}

/**
 * Row ordering. Applied client-side over the loaded page — `GET /suppliers` has
 * no sort parameter, so this reorders what is on screen, not the whole book.
 *
 * There is deliberately no "longest overdue" option, unlike the customers list.
 * That ordering needs the age of each supplier's oldest unpaid bill, and bills
 * are only readable one supplier at a time (`GET /suppliers/:id/debts`) — there
 * is no payables equivalent of `GET /debts` to resolve the whole page from.
 */
export enum SupplierSort {
  /** Most owed first — who to pay next. */
  DEBT_DESC = 'DEBT_DESC',
  NEWEST = 'NEWEST',
  NAME = 'NAME',
}

/** Shop-wide payables totals for the header cards. Never page-scoped. */
export interface SupplierStats {
  totalSuppliers: number;
  withDebtCount: number;
  /** Money string — sum still owed across every supplier. */
  totalOwed: string;
  openBills: number;
  /**
   * Money paid against bills that were later cancelled — now owed back BY the
   * suppliers. v1 only reports it; there is no endpoint to process a refund, so
   * surface it as a flagged line, never a button.
   */
  refundDue: string;
}

/**
 * A bill — one delivery the shop owes a supplier for.
 *
 * The same underlying debt record as a receivable, seen from the other side:
 * `creditor_type` is what separates them, and it is why these never surface in
 * `GET /debts`. Money is ALWAYS a string; see the note in debts.types.ts.
 */
export interface SupplierBill {
  id: number;
  creditor_type: CreditorType;
  debtor_type: DebtorType;
  debtor_shop_id: number;
  supplier_id: number;
  /** Optional at creation, but unique per supplier once set. */
  invoice_no: string | null;
  total_amount: string;
  paid_amount: string;
  /** total_amount - paid_amount, computed server-side. */
  remaining: string;
  status: DebtStatus;
  /** Reserved for a future version — nothing sets it yet. Ignore it. */
  due_date: string | null;
  note: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Body for POST /suppliers/:id/debts.
 *
 * `paidAmount` defaults to 0 server-side — the opposite of a customer receipt,
 * which defaults to paid in full. That asymmetry is correct: buying on credit is
 * the normal case for a delivery, where selling on credit is the exception.
 */
export interface CreateBillInput {
  totalAmount: string;
  /** What was handed over on delivery. Omitted means the whole bill is on credit. */
  paidAmount?: string;
  /**
   * Deliberately optional, matching the API.
   *
   * The duplicate-bill guard (409 `supplier.INVOICE_TAKEN`) engages only when a
   * number is given — which is the point: shops buying from a local supplier
   * often have no paper invoice at the moment the delivery arrives, and a
   * required field would block recording a debt they have genuinely incurred.
   * Protection is deferred to when the data exists rather than traded away.
   */
  invoiceNo?: string;
  note?: string;
}

export interface BillListParams {
  page?: number;
  limit?: number;
  /** Matches invoice number or note. */
  search?: string;
}

/**
 * Body for POST /suppliers/:id/payments.
 *
 * Without `debtId` the amount is applied to this supplier's oldest bills first
 * (FIFO) and may settle several at once. With it, only that one bill is touched.
 *
 * Deliberately narrower than the customer equivalent, which also carries
 * `method` and `note`: `CreateSupplierPaymentDto` documents only these two
 * fields, and NestJS rejects unrecognised ones outright. Worth revisiting with
 * the backend — how a supplier was paid is worth recording.
 */
export interface PaySupplierInput {
  amount: string;
  /** Omit for FIFO across every open bill. */
  debtId?: number;
}

export interface CreateSupplierInput {
  name: string;
  phone?: string;
  note?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

/** GET /suppliers/:id/summary — the same totals block used across the debts feature. */
export type SupplierSummary = DebtsSummary;

export const SUPPLIER_NOTE_MAX_LENGTH = 500;
