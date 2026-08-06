'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { isPositiveMoney } from '@/common/utils/money';
import { DebtStatus } from '@/features/shared/debts';
import type { PaymentApplication } from '@/features/shared/debts';
import { suppliersApi } from '../api/suppliers.api';
import type {
  BillListParams,
  CreateBillInput,
  PaySupplierInput,
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

/**
 * How many open bills the payment picker can offer.
 *
 * Not a display limit — the visible list is paginated separately. This bounds
 * only the "pay one specific bill" dropdown, and it has to be one request
 * because `status` takes a single value while "unpaid or partly paid" needs two.
 * A supplier carrying more than 100 unsettled bills at once would need the
 * server to filter by balance instead.
 */
const OPEN_BILLS_LIMIT = 100;

interface SupplierDetailOptions {
  /**
   * Load the visible bills list. False when only a payment form is open, which
   * is reachable straight from a list row without the account behind it.
   */
  withBills?: boolean;
  /** Page and search for the visible bills list. */
  billParams?: BillListParams;
  /**
   * Also load every open bill, for the payment picker.
   *
   * Deliberately separate from the list query. The list is paged and filtered by
   * whatever the owner typed; the picker must offer every bill a payment could
   * target regardless. Sharing one query would mean searching "INV-8" silently
   * narrowed what could be paid.
   */
  withOpenBills?: boolean;
}

/**
 * One supplier: their record, their totals, and their bills — plus recording a
 * new bill against them and paying what is owed.
 *
 * Pass null to keep every query idle while the modal is closed.
 */
export function useSupplierDetail(id: number | null, options: SupplierDetailOptions = {}) {
  const { withBills = false, billParams, withOpenBills = false } = options;
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

  // What the modal shows: one page, narrowed by whatever was searched.
  const billsQuery = useQuery({
    queryKey: ['suppliers', 'bills', id, billParams],
    queryFn: () => suppliersApi.bills(id as number, billParams),
    enabled: enabled && withBills,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  // What a payment may target: every open bill, unfiltered.
  const openBillsQuery = useQuery({
    queryKey: ['suppliers', 'open-bills', id],
    queryFn: () => suppliersApi.bills(id as number, { page: 1, limit: OPEN_BILLS_LIMIT }),
    enabled: enabled && withOpenBills,
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

  const payMutation = useMutation({
    mutationFn: (data: PaySupplierInput) =>
      suppliersApi.payBills(id as number, data) as Promise<{ data: PaymentApplication[] }>,
    // A payment can settle several bills at once and moves this supplier's
    // balance, the list row behind the modal, and the shop-wide payables totals.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['suppliers'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' }),
      ]);
    },
  });

  const bills: SupplierBill[] = billsQuery.data?.data?.data ?? [];
  const openBillCandidates: SupplierBill[] = openBillsQuery.data?.data?.data ?? [];

  return {
    supplier: (supplierQuery.data?.data as Supplier) ?? null,
    summary: (summaryQuery.data?.data as SupplierSummary) ?? EMPTY_SUMMARY,
    /** The page currently on screen, matching whatever was searched. */
    bills,
    billsTotal: (billsQuery.data?.data?.total as number) ?? 0,
    billsTotalPages: (billsQuery.data?.data?.totalPages as number) ?? 1,
    isFetchingBills: billsQuery.isFetching,
    /**
     * Only what still carries a balance — what a payment can actually target.
     * Cancelled bills are excluded even at a non-zero remaining: nothing is owed
     * on a bill that was called off.
     *
     * Filtered client-side because `status` takes one value and this needs both
     * OPEN and PARTIAL.
     */
    openBills: openBillCandidates.filter(
      (b) => b.status !== DebtStatus.CANCELLED && isPositiveMoney(b.remaining)
    ),
    isLoadingOpenBills: openBillsQuery.isLoading,
    isLoading: supplierQuery.isLoading || summaryQuery.isLoading || billsQuery.isLoading,
    error: supplierQuery.error ?? summaryQuery.error ?? billsQuery.error,
    recordBill: recordBillMutation.mutateAsync,
    isRecordingBill: recordBillMutation.isPending,
    payBills: payMutation.mutateAsync,
    isPaying: payMutation.isPending,
  };
}
