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

import type { DebtsSummary } from '@/features/shared/debts/types/debts.types';

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
