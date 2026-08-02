'use client';

import { useQuery } from '@tanstack/react-query';
import { debtsApi, DebtorType } from '@/features/shared/debts';
import type { DebtsSummary } from '@/features/shared/debts';
import { customersApi } from '../api/customers.api';
import type { CustomerStats } from '../types/customers.types';

/**
 * The headline numbers are shop-wide, so none of them can come off the current
 * page: search for one name and "12 unpaid invoices" must not become "2".
 * Each figure is therefore read from an endpoint that already counts the whole
 * set — two `limit: 1` list calls purely for their `total`, and the debts
 * summary for the money. All four stay correct however the table is filtered.
 */
const COUNT_ONLY = { page: 1, limit: 1 } as const;
const WITH_DEBT = { page: 1, limit: 1, hasDebt: true } as const;

/**
 * Scoped to what customers owe this shop. A shop owner's `/debts` view is
 * already restricted server-side to debts their shop is a party to, so this
 * needs no shop id.
 */
const CUSTOMER_DEBTS = { debtorType: DebtorType.CUSTOMER } as const;

const EMPTY: CustomerStats = {
  totalCustomers: 0,
  withDebtCount: 0,
  totalOutstanding: '0.00',
  openInvoices: 0,
};

/**
 * Totals for the customers page header.
 *
 * Query keys sit under `['customers']` and `['debts']` on purpose: collecting a
 * payment or adding a customer already invalidates both, so the cards refresh
 * with the table instead of needing their own invalidation wiring.
 */
export function useCustomerStats() {
  const totalQuery = useQuery({
    queryKey: ['customers', 'stats', 'total'],
    queryFn: () => customersApi.list(COUNT_ONLY),
    staleTime: 0,
  });

  const withDebtQuery = useQuery({
    queryKey: ['customers', 'stats', 'withDebt'],
    queryFn: () => customersApi.list(WITH_DEBT),
    staleTime: 0,
  });

  const summaryQuery = useQuery({
    queryKey: ['debts', 'summary', CUSTOMER_DEBTS],
    queryFn: () => debtsApi.summary(CUSTOMER_DEBTS),
    staleTime: 0,
  });

  const summary = (summaryQuery.data?.data as DebtsSummary) ?? null;

  const stats: CustomerStats = {
    totalCustomers: (totalQuery.data?.data?.total as number) ?? EMPTY.totalCustomers,
    withDebtCount: (withDebtQuery.data?.data?.total as number) ?? EMPTY.withDebtCount,
    totalOutstanding: summary?.total_remaining ?? EMPTY.totalOutstanding,
    openInvoices: summary?.open_count ?? EMPTY.openInvoices,
  };

  return {
    stats,
    isLoading: totalQuery.isLoading || withDebtQuery.isLoading || summaryQuery.isLoading,
  };
}
