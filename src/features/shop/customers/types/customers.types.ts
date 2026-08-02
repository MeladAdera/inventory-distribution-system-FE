// Credit customers — people a shop sells to on deferred payment.
//
// Shop-scoped by design: WAREHOUSE_ADMIN has no access to /customers at all,
// so this feature lives under features/shop and never appears in the admin portal.

import type { DebtsSummary } from '@/features/shared/debts/types/debts.types';

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  /** Optional, but unique per shop when set. */
  phone: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Carried on every list row — no need to sum this customer's debts client-side. */
  open_debts_count: number;
  /** Money string ("25.00"). Never parse for arithmetic; use the money helpers. */
  total_remaining: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  /** Matches name or phone. */
  search?: string;
  /** Only customers who still owe money. */
  hasDebt?: boolean;
  /** Include deactivated customers — hidden by default. */
  includeInactive?: boolean;
}

/**
 * Which slice of the list the toolbar is showing. `REMOVED` widens the list to
 * include deactivated customers rather than narrowing it to only those — the
 * API offers `includeInactive`, not an "inactive only" filter, and faking one
 * client-side would make the row count disagree with the pagination.
 */
export enum CustomerView {
  ALL = 'ALL',
  HAS_DEBT = 'HAS_DEBT',
  REMOVED = 'REMOVED',
}

/**
 * Row ordering. Applied client-side over the loaded page — `GET /customers` has
 * no sort parameter, so this reorders what is on screen, not the whole ledger.
 */
export enum CustomerSort {
  /** Most owed first — who to chase today. */
  DEBT_DESC = 'DEBT_DESC',
  /** Longest-unpaid sale first. */
  OLDEST_DEBT = 'OLDEST_DEBT',
  NEWEST = 'NEWEST',
  NAME = 'NAME',
}

/**
 * A list row with the aging of its oldest unpaid sale resolved.
 *
 * `oldest_debt_age_days` is null when nothing is owed. It is derived from the
 * debts ledger, not carried on the customer record — see `useCustomerRows`.
 */
export interface CustomerRow extends Customer {
  oldest_debt_age_days: number | null;
}

/** Shop-wide receivables totals for the header cards. Never page-scoped. */
export interface CustomerStats {
  totalCustomers: number;
  withDebtCount: number;
  /** Money string — sum still owed across every customer. */
  totalOutstanding: string;
  openInvoices: number;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  note?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

/** GET /customers/:id/summary — the same totals block used across the debts feature. */
export type CustomerSummary = DebtsSummary;

export const CUSTOMER_NOTE_MAX_LENGTH = 500;
