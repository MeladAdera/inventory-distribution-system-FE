'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { debtsApi } from '../api/debts.api';
import { AgingBucket } from '../types/debts.types';
import type {
  AgingRow,
  DebtsSummary,
  ReceivablesParams,
  ShopDebtSummary,
} from '../types/debts.types';

const EMPTY_SUMMARY: DebtsSummary = {
  total_billed: '0.00',
  total_collected: '0.00',
  total_remaining: '0.00',
  open_count: 0,
  refund_due: '0.00',
};

// The API always returns all three buckets, even at count 0 — but the chart must
// still render three bars before the first response lands.
const EMPTY_AGING: AgingRow[] = [
  { bucket: AgingBucket.RECENT, count: 0, amount: '0.00' },
  { bucket: AgingBucket.LATE, count: 0, amount: '0.00' },
  { bucket: AgingBucket.OVERDUE, count: 0, amount: '0.00' },
];

const EMPTY_SHOP_SUMMARY: Omit<ShopDebtSummary, 'shop_id'> = {
  owed_by_shop: EMPTY_SUMMARY,
  owed_to_shop: EMPTY_SUMMARY,
};

/**
 * Totals across whatever the caller can see. A balance right now, not a series
 * over time — there is deliberately no `period` param.
 */
export function useReceivables(params?: ReceivablesParams) {
  const query = useQuery({
    queryKey: ['analytics', 'receivables', params],
    queryFn: () => debtsApi.receivables(params),
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

/** Owed money grouped by age. Amounts are REMAINING balances, not original sale values. */
export function useReceivablesAging(params?: ReceivablesParams) {
  const query = useQuery({
    queryKey: ['analytics', 'receivables-aging', params],
    queryFn: () => debtsApi.receivablesAging(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const rows = (query.data?.data as AgingRow[]) ?? [];

  return {
    rows: rows.length > 0 ? rows : EMPTY_AGING,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

/**
 * One shop's two-sided ledger. `owed_by_shop` (to the warehouse) and
 * `owed_to_shop` (from its customers) are reported separately and must never be
 * netted against each other — they answer different questions.
 */
export function useShopDebtSummary(shopId: number | null | undefined) {
  const query = useQuery({
    queryKey: ['debts', 'shop-summary', shopId],
    queryFn: () => debtsApi.shopSummary(shopId as number),
    enabled: shopId != null,
    staleTime: 0,
  });

  const data = query.data?.data as ShopDebtSummary | undefined;

  return {
    owedByShop: data?.owed_by_shop ?? EMPTY_SHOP_SUMMARY.owed_by_shop,
    owedToShop: data?.owed_to_shop ?? EMPTY_SHOP_SUMMARY.owed_to_shop,
    isLoading: query.isLoading,
    error: query.error,
  };
}
