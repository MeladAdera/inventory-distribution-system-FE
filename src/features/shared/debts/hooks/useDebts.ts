'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { debtsApi } from '../api/debts.api';
import type {
  Debt,
  DebtListItem,
  DebtListParams,
  DebtPayment,
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
        queryClient.invalidateQueries({ queryKey: ['receipts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  return {
    payments: (query.data?.data as DebtPayment[]) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    reversePayment: reverseMutation.mutateAsync,
    isReversing: reverseMutation.isPending,
  };
}
