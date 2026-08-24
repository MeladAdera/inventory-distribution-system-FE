'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShiftSessionStatus } from '../types/shifts.types';
import { addDays, startOfWeek, toISODate } from '../utils/time.utils';

export const DATE_PRESETS = ['today', 'yesterday', 'week', 'month', 'custom'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

/**
 * Columns the table can be ordered by.
 *
 * All of it is client-side: `GET /shifts/sessions` has no sort parameter, so
 * this reorders the page already loaded rather than the whole ledger — the same
 * caveat the customers and suppliers lists carry, and the UI says so.
 */
export type SortKey = 'time' | 'employee' | 'shift' | 'receipts' | 'sales' | 'variance';
export type SortDir = 'asc' | 'desc';

export interface HistoryFilters {
  preset: DatePreset;
  /** Only meaningful when preset is `custom`; otherwise derived from it. */
  from?: string;
  to?: string;
  userId?: number;
  status?: ShiftSessionStatus;
  /**
   * Only shifts whose drawer did not balance. Client-side for the same reason
   * as sorting — the endpoint cannot filter on the variance.
   */
  varianceOnly: boolean;
  sortKey: SortKey | null;
  sortDir: SortDir;
  page: number;
}

/** Turns a preset into the business-date range the API actually takes. */
export function presetRange(
  preset: DatePreset,
  today = new Date()
): { from?: string; to?: string } {
  switch (preset) {
    case 'today':
      return { from: toISODate(today), to: toISODate(today) };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { from: toISODate(y), to: toISODate(y) };
    }
    case 'week': {
      const start = startOfWeek(today);
      return { from: toISODate(start), to: toISODate(addDays(start, 6)) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: toISODate(start), to: toISODate(end) };
    }
    case 'custom':
    default:
      return {};
  }
}

function isPreset(value: string | null): value is DatePreset {
  return value !== null && (DATE_PRESETS as readonly string[]).includes(value);
}

/**
 * Every filter, the sort and the page, held in the URL.
 *
 * A filtered view of the shift ledger is something an owner sends to someone
 * else or comes back to tomorrow, so it has to be a link — and the redesign
 * makes that an acceptance criterion. Keeping it here rather than in component
 * state also means the back button undoes a filter, which is what people
 * already expect it to do.
 */
export function useHistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters: HistoryFilters = useMemo(() => {
    const preset = isPreset(params.get('preset')) ? (params.get('preset') as DatePreset) : 'week';
    const userId = params.get('emp');
    const status = params.get('status');
    const sortKey = params.get('sort') as SortKey | null;

    return {
      preset,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      userId: userId ? Number(userId) : undefined,
      status:
        status === ShiftSessionStatus.OPEN || status === ShiftSessionStatus.CLOSED
          ? status
          : undefined,
      varianceOnly: params.get('var') === '1',
      sortKey,
      sortDir: params.get('dir') === 'asc' ? 'asc' : 'desc',
      page: Math.max(1, Number(params.get('page') ?? '1') || 1),
    };
  }, [params]);

  const write = useCallback(
    (next: Partial<HistoryFilters>) => {
      const search = new URLSearchParams(params.toString());
      const merged = { ...filters, ...next };

      // Any change to what is being filtered invalidates the page number —
      // narrowing the results while sitting on page 3 lands on an empty table.
      const changedFilter =
        'preset' in next ||
        'from' in next ||
        'to' in next ||
        'userId' in next ||
        'status' in next ||
        'varianceOnly' in next;
      if (changedFilter && !('page' in next)) merged.page = 1;

      const set = (key: string, value: string | undefined | null) => {
        if (value === undefined || value === null || value === '') search.delete(key);
        else search.set(key, value);
      };

      // Defaults are left out of the URL entirely so a plain link stays clean.
      set('preset', merged.preset === 'week' ? undefined : merged.preset);
      set('from', merged.preset === 'custom' ? merged.from : undefined);
      set('to', merged.preset === 'custom' ? merged.to : undefined);
      set('emp', merged.userId ? String(merged.userId) : undefined);
      set('status', merged.status);
      set('var', merged.varianceOnly ? '1' : undefined);
      set('sort', merged.sortKey ?? undefined);
      set('dir', merged.sortKey && merged.sortDir === 'asc' ? 'asc' : undefined);
      set('page', merged.page > 1 ? String(merged.page) : undefined);

      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [filters, params, pathname, router]
  );

  /** Clears every filter but keeps the tab — the reset button. */
  const reset = useCallback(() => {
    const search = new URLSearchParams();
    const tab = params.get('tab');
    if (tab) search.set('tab', tab);
    router.replace(`${pathname}?${search.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  /** Clicking a column header: same key flips direction, a new key starts descending. */
  const toggleSort = useCallback(
    (key: SortKey) => {
      if (filters.sortKey === key) {
        write({ sortDir: filters.sortDir === 'desc' ? 'asc' : 'desc' });
      } else {
        write({ sortKey: key, sortDir: 'desc' });
      }
    },
    [filters.sortKey, filters.sortDir, write]
  );

  /** The date range actually sent to the API for the current preset. */
  const range = useMemo(
    () =>
      filters.preset === 'custom'
        ? { from: filters.from, to: filters.to }
        : presetRange(filters.preset),
    [filters.preset, filters.from, filters.to]
  );

  const activeCount =
    (filters.preset === 'week' ? 0 : 1) +
    (filters.userId ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.varianceOnly ? 1 : 0);

  return { filters, range, activeCount, setFilters: write, reset, toggleSort };
}
