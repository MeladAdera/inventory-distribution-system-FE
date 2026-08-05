'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isPositiveMoney } from '@/common/utils/money';
import { DebtStatus } from '@/features/shared/debts';
import { suppliersApi } from '../api/suppliers.api';
import type {
  CreateBillInput,
  Supplier,
  SupplierBill,
  SupplierSummary,
} from '../types/suppliers.types';

const EMPTY_SUMMARY: SupplierSummary = {
  total_billed: '0.00',
  total_collected: '0.00',
  total_remaining: '0.00',
  open_count: 0,
  refund_due: '0.00',
};

// A supplier's bills are paginated, and the detail view wants all of them at
// once — both to list them and, from Phase 3, to populate the "pay one specific
// bill" picker. The default page size would silently truncate that list.
const BILLS_PAGE_SIZE = 100;

/**
 * One supplier: their record, their totals, and their bills — plus recording a
 * new bill against them.
 *
 * Pass null to keep every query idle while the modal is closed.
 */
export function useSupplierDetail(id: number | null) {
  const queryClient = useQueryClient();
  const enabled = id !== null;

  const supplierQuery = useQuery({
    queryKey: ['suppliers', 'detail', id],
    queryFn: () => suppliersApi.getById(id as number),
    enabled,
    staleTime: 0,
  });

  const summaryQuery = useQuery({
    queryKey: ['suppliers', 'summary', id],
    queryFn: () => suppliersApi.summary(id as number),
    enabled,
    staleTime: 0,
  });

  const billsQuery = useQuery({
    queryKey: ['suppliers', 'bills', id],
    queryFn: () => suppliersApi.bills(id as number, { page: 1, limit: BILLS_PAGE_SIZE }),
    enabled,
    staleTime: 0,
  });

  const recordBillMutation = useMutation({
    mutationFn: (data: CreateBillInput) =>
      suppliersApi.recordBill(id as number, data) as Promise<{ data: SupplierBill }>,
    // A new bill changes this supplier's balance, the list row behind the modal,
    // and the shop-wide payables totals in the header cards.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  const bills: SupplierBill[] = billsQuery.data?.data?.data ?? [];

  return {
    supplier: (supplierQuery.data?.data as Supplier) ?? null,
    summary: (summaryQuery.data?.data as SupplierSummary) ?? EMPTY_SUMMARY,
    bills,
    /**
     * Only what still carries a balance — what a payment can actually target.
     * Cancelled bills are excluded even at a non-zero remaining: nothing is owed
     * on a bill that was called off.
     */
    openBills: bills.filter(
      (b) => b.status !== DebtStatus.CANCELLED && isPositiveMoney(b.remaining)
    ),
    isLoading: supplierQuery.isLoading || summaryQuery.isLoading || billsQuery.isLoading,
    error: supplierQuery.error ?? summaryQuery.error ?? billsQuery.error,
    recordBill: recordBillMutation.mutateAsync,
    isRecordingBill: recordBillMutation.isPending,
  };
}
