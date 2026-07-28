'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isPositiveMoney } from '@/common/utils/money';
import { customersApi, type CollectPaymentInput } from '../api/customers.api';
import type { Customer, CustomerSummary } from '../types/customers.types';
import type { DebtListItem, PaymentApplication } from '@/features/shared/debts';

const EMPTY_SUMMARY: CustomerSummary = {
  total_billed: '0.00',
  total_collected: '0.00',
  total_remaining: '0.00',
  open_count: 0,
  refund_due: '0.00',
};

/**
 * Swagger documents no response schema for these endpoints, so the list shape
 * isn't guaranteed to be the paginated envelope the other lists use. Accept
 * either a bare array or a paginated block rather than silently rendering empty.
 */
function unwrapList<T>(payload: unknown): T[] {
  const body = (payload as { data?: unknown })?.data;
  if (Array.isArray(body)) return body as T[];
  const nested = (body as { data?: unknown })?.data;
  return Array.isArray(nested) ? (nested as T[]) : [];
}

/**
 * One customer: their record, their totals, and their unpaid sales — plus
 * collecting money from them.
 *
 * Pass null to keep every query idle while the modal is closed.
 */
export function useCustomerDetail(id: number | null) {
  const queryClient = useQueryClient();
  const enabled = id !== null;

  const customerQuery = useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => customersApi.getById(id as number),
    enabled,
    staleTime: 0,
  });

  const summaryQuery = useQuery({
    queryKey: ['customers', 'summary', id],
    queryFn: () => customersApi.summary(id as number),
    enabled,
    staleTime: 0,
  });

  const debtsQuery = useQuery({
    queryKey: ['customers', 'debts', id],
    queryFn: () => customersApi.debts(id as number),
    enabled,
    staleTime: 0,
  });

  const collectMutation = useMutation({
    mutationFn: (data: CollectPaymentInput) =>
      customersApi.collectPayment(id as number, data) as Promise<{ data: PaymentApplication[] }>,
    // A payment can settle several sales at once, changes this customer's
    // balance, flips receipts to settled, and moves revenue-adjacent figures.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['debts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['receipts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  const debts = unwrapList<DebtListItem>(debtsQuery.data);

  return {
    customer: (customerQuery.data?.data as Customer) ?? null,
    summary: (summaryQuery.data?.data as CustomerSummary) ?? EMPTY_SUMMARY,
    debts,
    /** Only what's still owed — what the collect form can actually target. */
    openDebts: debts.filter((d) => isPositiveMoney(d.remaining)),
    isLoading: customerQuery.isLoading || summaryQuery.isLoading || debtsQuery.isLoading,
    error: customerQuery.error ?? summaryQuery.error ?? debtsQuery.error,
    collectPayment: collectMutation.mutateAsync,
    isCollecting: collectMutation.isPending,
  };
}
