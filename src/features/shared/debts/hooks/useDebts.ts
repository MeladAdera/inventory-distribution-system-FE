'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isPositiveMoney } from '@/common/utils/money';
import { debtsApi } from '../api/debts.api';
import { DebtorType, DebtStatus } from '../types/debts.types';
import type {
  Debt,
  DebtListItem,
  DebtListParams,
  DebtPayment,
  DebtPaymentRow,
  DebtsSummary,
  ReceivablesParams,
} from '../types/debts.types';

const EMPTY_SUMMARY: DebtsSummary = {
  total_billed: '0.00',
  total_collected: '0.00',
  total_remaining: '0.00',
  open_count: 0,
  refund_due: '0.00',
};

/** Paginated debts list, scoped server-side by the caller's role. */
export function useDebts(params?: DebtListParams) {
  const query = useQuery({
    queryKey: ['debts', 'list', params],
    queryFn: () => debtsApi.list(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const debts: DebtListItem[] = query.data?.data?.data ?? [];

  return {
    debts,
    total: (query.data?.data?.total as number) ?? 0,
    totalPages: (query.data?.data?.totalPages as number) ?? 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

// Module-level so the query key stays referentially stable across renders.
// The 100 cap is a simplification: a shop carrying more than 100 unsettled
// orders at once would need pagination here.
const OWED_ORDERS_SCOPE: DebtListParams = { debtorType: DebtorType.SHOP, limit: 100 };

/**
 * The orders behind what a shop owes the warehouse.
 *
 * `GET /debts?debtorType=SHOP` is already scoped server-side to debts the
 * caller's shop is a party to, so a shop owner gets exactly their own
 * order-debts — the same call the admin ledger makes, seen from the other side.
 *
 * Returns both cuts: `unsettled` is what the balance is actually made of, and
 * `orderDebts` keeps the settled ones alongside them so the card can offer
 * recent history without a second request. Split here rather than on the server
 * because `status` takes a single value and "OPEN or PARTIAL" needs two.
 *
 * Cancelled debts are dropped from both — an inert row explains nothing.
 *
 * Pass `enabled: false` when the shop owes nothing, to skip the request entirely.
 */
export function useOwedOrderDebts(enabled = true) {
  const query = useQuery({
    queryKey: ['debts', 'list', OWED_ORDERS_SCOPE],
    queryFn: () => debtsApi.list(OWED_ORDERS_SCOPE),
    enabled,
    staleTime: 0,
  });

  const rows: DebtListItem[] = query.data?.data?.data ?? [];

  const { orderDebts, unsettled } = useMemo(() => {
    const live = rows
      .filter((d) => d.status !== DebtStatus.CANCELLED)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { orderDebts: live, unsettled: live.filter((d) => isPositiveMoney(d.remaining)) };
  }, [rows]);

  return {
    orderDebts,
    unsettled,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/** Totals across whatever the caller can see. A balance right now, not a trend. */
export function useDebtsSummary(params?: ReceivablesParams) {
  const query = useQuery({
    queryKey: ['debts', 'summary', params],
    queryFn: () => debtsApi.summary(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  return {
    summary: (query.data?.data as DebtsSummary) ?? EMPTY_SUMMARY,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

/** One debt. Pass null to keep the query idle (e.g. while a modal is closed). */
export function useDebtDetail(id: number | null) {
  const query = useQuery({
    queryKey: ['debts', 'detail', id],
    queryFn: () => debtsApi.getById(id as number),
    enabled: id !== null,
    staleTime: 0,
  });

  return {
    debt: (query.data?.data as Debt) ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * A debt's payment ledger, plus reversal.
 *
 * Reversing appends a negative row instead of deleting the original, and can
 * move the debt's status backwards (PAID → PARTIAL), so a successful reverse
 * has to refresh the debt itself and the customer balances that roll up from it.
 */
export function useDebtPayments(debtId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['debts', 'payments', debtId],
    queryFn: () => debtsApi.payments(debtId as number),
    enabled: debtId !== null,
    staleTime: 0,
  });

  const reverseMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason?: string }) =>
      debtsApi.reversePayment(debtId as number, paymentId, reason ? { reason } : {}),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['debts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'all' }),
        // Payables run through this same ledger, so undoing a supplier payment
        // has to move the supplier balances too.
        queryClient.invalidateQueries({ queryKey: ['suppliers'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['receipts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  // Plain array, not paginated — one envelope level only.
  const raw = (query.data?.data as DebtPayment[]) ?? [];

  // An original payment has no flag saying it was undone; the only evidence is
  // another row pointing back at it. Resolve that here so the UI can disable
  // "reverse" up front instead of eating a 400 debt.ALREADY_REVERSED.
  const payments: DebtPaymentRow[] = useMemo(() => {
    const reversedIds = new Set(
      raw.map((p) => p.reverses_payment_id).filter((id): id is number => id != null)
    );
    return raw.map((p) => ({ ...p, isReversed: reversedIds.has(p.id) }));
  }, [raw]);

  return {
    payments,
    isLoading: query.isLoading,
    error: query.error,
    reversePayment: reverseMutation.mutateAsync,
    isReversing: reverseMutation.isPending,
  };
}
