'use client';

import { useQuery } from '@tanstack/react-query';
import { usePayables } from '@/features/shared/debts';
import { suppliersApi } from '../api/suppliers.api';
import type { SupplierStats } from '../types/suppliers.types';

/**
 * The headline numbers are shop-wide, so none of them can come off the current
 * page: search for one name and "12 unpaid bills" must not become "2". Each
 * figure is therefore read from an endpoint that already counts the whole set —
 * two `limit: 1` list calls purely for their `total`, and the payables summary
 * for the money. All four stay correct however the table is filtered.
 */
const COUNT_ONLY = { page: 1, limit: 1 } as const;
const WITH_DEBT = { page: 1, limit: 1, hasDebt: true } as const;

const EMPTY: SupplierStats = {
  totalSuppliers: 0,
  withDebtCount: 0,
  totalOwed: '0.00',
  openBills: 0,
  refundDue: '0.00',
};

/**
 * Totals for the suppliers page header.
 *
 * The money comes from `/analytics/payables` rather than a filter on `/debts` —
 * that endpoint is hardcoded server-side to receivables and never returns
 * supplier bills, so payables have to be asked for by name.
 */
export function useSupplierStats() {
  const totalQuery = useQuery({
    queryKey: ['suppliers', 'stats', 'total'],
    queryFn: () => suppliersApi.list(COUNT_ONLY),
    staleTime: 0,
  });

  const withDebtQuery = useQuery({
    queryKey: ['suppliers', 'stats', 'withDebt'],
    queryFn: () => suppliersApi.list(WITH_DEBT),
    staleTime: 0,
  });

  const { summary, isLoading: isLoadingSummary } = usePayables();

  const stats: SupplierStats = {
    totalSuppliers: (totalQuery.data?.data?.total as number) ?? EMPTY.totalSuppliers,
    withDebtCount: (withDebtQuery.data?.data?.total as number) ?? EMPTY.withDebtCount,
    totalOwed: summary.total_remaining,
    openBills: summary.open_count,
    refundDue: summary.refund_due,
  };

  return {
    stats,
    isLoading: totalQuery.isLoading || withDebtQuery.isLoading || isLoadingSummary,
  };
}
