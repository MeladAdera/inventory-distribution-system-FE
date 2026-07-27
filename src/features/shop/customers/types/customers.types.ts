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

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  note?: string;
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

/** GET /customers/:id/summary — the same totals block used across the debts feature. */
export type CustomerSummary = DebtsSummary;

export const CUSTOMER_NOTE_MAX_LENGTH = 500;
