'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receiptsApi } from '@/features/shared/receipts';
import type { ReceiptListItem } from '@/features/shared/receipts';
import { startOfWeek } from '@/common/utils/date.utils';
import type { ReceiptStats } from '../types/clientReceipts.types';

/**
 * The headline cards are shop-wide, so they can't be read off the page the user
 * happens to be on. `GET /receipts` reports no aggregates, so they are derived
 * from a single wide fetch instead of four separate counting requests.
 *
 * The cap bounds that fetch. `total` is still exact — it comes from the response
 * envelope, not the rows — so only the summed figures can understate, and only
 * for a shop that has raised more than this many receipts.
 */
const STATS_WINDOW = 500;

const EMPTY: ReceiptStats = { total: 0, thisWeek: 0, itemsConsumed: 0, lastReceiptAt: null };

export function useReceiptStats() {
  const query = useQuery({
    queryKey: ['receipts', { scope: 'stats', limit: STATS_WINDOW }],
    queryFn: () => receiptsApi.list({ page: 1, limit: STATS_WINDOW }),
  });

  const stats: ReceiptStats = useMemo(() => {
    const rows: ReceiptListItem[] = query.data?.data?.data ?? [];
    const total: number = query.data?.data?.total ?? 0;
    if (rows.length === 0) return { ...EMPTY, total };

    const weekStart = startOfWeek().getTime();

    // A cancelled receipt hands its stock back, so it is not consumption and
    // not activity — but it did happen, and `total` still counts it.
    const live = rows.filter((r) => !r.is_cancelled);

    return {
      total,
      thisWeek: live.filter((r) => new Date(r.created_at).getTime() >= weekStart).length,
      itemsConsumed: live.reduce((sum, r) => sum + r.total_items, 0),
      // The list arrives newest-first; scan anyway rather than trusting order.
      lastReceiptAt: rows.reduce(
        (newest, r) => (newest === null || r.created_at > newest ? r.created_at : newest),
        null as string | null
      ),
    };
  }, [query.data]);

  return { stats, isLoading: query.isLoading };
}
