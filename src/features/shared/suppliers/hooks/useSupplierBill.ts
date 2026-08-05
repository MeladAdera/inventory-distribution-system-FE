'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsApi, useDebtPayments } from '@/features/shared/debts';

/**
 * One bill's ledger, plus the two ways to undo something on it.
 *
 * Reversal comes straight from the shared debts layer — a supplier payment is
 * the same record as a customer one, and `useDebtPayments` already resolves
 * which rows have been undone so the button can be withheld rather than the
 * 400 explained.
 *
 * Cancelling is the payables-only half, which is why it lives here: `POST
 * /debts/:id/cancel` rejects receivables outright, so nothing in the customers
 * feature should be able to reach it.
 *
 * Pass null to keep every query idle while the modal is closed.
 */
export function useSupplierBill(billId: number | null) {
  const queryClient = useQueryClient();

  const { payments, isLoading, error, reversePayment, isReversing } = useDebtPayments(billId);

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => debtsApi.cancel(billId as number, reason ? { reason } : {}),
    // Voiding a bill drops it out of the payables balance, the supplier's row,
    // and the header totals. If it had been partly paid the supplier now owes a
    // refund, which surfaces under `refund_due` on the summary.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['debts'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  return {
    payments,
    isLoading,
    error,
    reversePayment,
    isReversing,
    cancelBill: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
  };
}
