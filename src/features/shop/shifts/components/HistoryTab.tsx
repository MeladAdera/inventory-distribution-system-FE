'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/common/components';
import { Button } from '@/common/components/ui/button';
import { Modal } from '@/common/components/Modal';
import { NARROW_QUERY, useMediaQuery } from '@/common/hooks/useMediaQuery';
import { formatMoneyGrouped, parseMoney, sumMoney } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useShiftSessions } from '../hooks/useShiftSessions';
import { useShopPeople } from '../hooks/useShopPeople';
import { useHistoryFilters, type SortKey } from '../hooks/useHistoryFilters';
import { fromISODate } from '../utils/time.utils';
import type { ShiftSessionRow } from '../types/shifts.types';
import { HistoryFilterControls, FilterButton } from './history/HistoryFilters';
import { SessionsTable } from './history/SessionsTable';
import { ShiftDrawer } from './history/ShiftDrawer';
import { VarianceValue } from './ui/VarianceValue';
import { EmptyState, ErrorState, TableSkeleton } from './ui/DataStates';

const LIMIT = 15;

/**
 * Shift history. Owner only — GET /shifts/sessions is 403 for an EMPLOYEE.
 *
 * Filters, sort and page live in the URL, so a narrowed view is a link someone
 * can send or come back to, and the back button undoes a filter.
 */
export function HistoryTab() {
  const { t, locale } = useI18n();
  const s = t.shifts;
  const queryClient = useQueryClient();
  const isNarrow = useMediaQuery(NARROW_QUERY);

  const { filters, range, activeCount, setFilters, reset, toggleSort } = useHistoryFilters();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      page: filters.page,
      limit: LIMIT,
      ...(range.from ? { from: range.from } : {}),
      ...(range.to ? { to: range.to } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }),
    [filters.page, filters.userId, filters.status, range.from, range.to]
  );

  const { sessions, total, isLoading, error } = useShiftSessions(params);
  const { people, userNames } = useShopPeople();

  // The variance filter and the sort both run over the page already fetched —
  // the endpoint offers neither — so they narrow and reorder what is on screen.
  const visible = useMemo(() => {
    const rows = filters.varianceOnly
      ? sessions.filter((r) => r.cash_difference !== null && parseMoney(r.cash_difference) !== 0)
      : sessions;
    return filters.sortKey ? sortRows(rows, filters.sortKey, filters.sortDir === 'asc') : rows;
  }, [sessions, filters.varianceOnly, filters.sortKey, filters.sortDir]);

  // Regrouped after filtering and sorting, so a day heading never sits above
  // rows that were sorted out from under it.
  const groups = useMemo(() => {
    const map = new Map<string, ShiftSessionRow[]>();
    visible.forEach((row) => {
      const bucket = map.get(row.business_date);
      if (bucket) bucket.push(row);
      else map.set(row.business_date, [row]);
    });
    return Array.from(map.entries());
  }, [visible]);

  const summary = useMemo(
    () => ({
      sold: sumMoney(visible.map((r) => r.sales_total)),
      net: sumMoney(visible.map((r) => r.cash_difference ?? '0.00')),
    }),
    [visible]
  );

  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(
      // Fed as UTC noon so the label cannot slip a day across timezones.
      new Date(
        Date.UTC(
          fromISODate(date).getFullYear(),
          fromISODate(date).getMonth(),
          fromISODate(date).getDate(),
          12
        )
      )
    );

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  const filterLabels = {
    presets: s.history.presets,
    from: s.history.filters.from,
    to: s.history.filters.to,
    employee: s.history.filters.employee,
    allEmployees: s.history.filters.allEmployees,
    status: s.history.filters.status,
    allStatuses: s.history.filters.allStatuses,
    open: s.history.filters.open,
    closed: s.history.filters.closed,
    varianceOnly: s.history.varianceOnly,
    clear: s.history.filters.clear,
    filterBtn: s.history.filterBtn,
  };

  if (error) {
    return (
      <ErrorState
        title={s.history.errorMsg}
        detail={getErrorMessage(error)}
        retryLabel={s.page.retry}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['shifts'] })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold text-ink-900">{s.history.title}</h2>
          <p className="mt-1 text-[13px] text-ink-500">{s.history.subtitle}</p>
        </div>
        {isNarrow && (
          <FilterButton
            count={activeCount}
            onClick={() => setSheetOpen(true)}
            label={s.history.filterBtn}
          />
        )}
      </header>

      {/* On a phone the filters live in a sheet; the row would otherwise take
          most of the first screen before a single shift appeared. */}
      {!isNarrow && (
        <HistoryFilterControls
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          people={people}
          labels={filterLabels}
        />
      )}

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : groups.length === 0 ? (
        <EmptyState
          title={s.history.empty}
          body={s.history.subtitle}
          primaryLabel={activeCount > 0 ? s.history.filters.clear : undefined}
          onPrimary={reset}
        />
      ) : (
        <>
          {/* What the current filter actually adds up to, above the rows. */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-border bg-paper px-4 py-2.5 text-[12.5px]">
            <span className="text-ink-500">
              {s.history.summary.count.replace('{count}', String(total))} ·{' '}
              {s.history.summary.newestFirst}
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-ink-500">
                {s.history.summary.totalSales}:{' '}
                <span dir="ltr" className="font-semibold tabular-nums text-ink-800">
                  {formatMoneyGrouped(summary.sold)} {t.debts.currency}
                </span>
              </span>
              <span className="flex items-center gap-1 text-ink-500">
                {s.history.summary.netVariance}:
                <VarianceValue value={summary.net} currency={t.debts.currency} />
              </span>
            </span>
          </div>

          <SessionsTable
            groups={groups}
            rows={visible}
            sortKey={filters.sortKey}
            sortDir={filters.sortDir}
            onSort={toggleSort}
            onSelect={(row) => setSelectedId(row.id)}
            userNames={userNames}
            currency={t.debts.currency}
            formatDay={formatDay}
            formatTime={formatTime}
            labels={{
              cols: {
                employee: s.history.cols.employee,
                shift: s.history.cols.shift,
                opened: s.history.cols.opened,
                duration: s.history.duration,
                receipts: s.report.cols.receipts,
                sold: s.history.cols.sold,
                difference: s.history.cols.difference,
                status: s.history.filters.status,
              },
              states: { completed: s.states.completed, open: s.states.open },
              noSlot: s.history.noSlot,
              closedBy: s.history.closedBy,
              stillOpen: s.history.stillOpen,
              notCounted: s.history.notCounted,
              details: s.history.details,
              pageOnlyNote: s.history.pageOnlyNote,
              attention: s.history.attention,
            }}
          />
        </>
      )}

      {total > LIMIT && (
        <Pagination
          page={filters.page}
          total={total}
          limit={LIMIT}
          onPageChange={(page) => setFilters({ page })}
        />
      )}

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={s.history.filterBtn}
        size="sm"
      >
        <HistoryFilterControls
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          people={people}
          labels={filterLabels}
          stacked
        />
        <Button className="mt-5 w-full" onClick={() => setSheetOpen(false)}>
          {s.history.showResults.replace('{count}', String(total))}
        </Button>
      </Modal>

      <ShiftDrawer
        sessionId={selectedId}
        onClose={() => setSelectedId(null)}
        currency={t.debts.currency}
        userNames={userNames}
        formatDay={formatDay}
        formatTime={formatTime}
        labels={{ ...s.detail, duration: s.history.duration }}
        noSlotLabel={s.history.noSlot}
        stillOpenLabel={s.history.stillOpen}
        notCountedLabel={s.history.notCounted}
        statusLabels={{ completed: s.states.completed, open: s.states.open }}
      />
    </div>
  );
}

/** Client-side ordering over the loaded page. */
function sortRows(rows: ShiftSessionRow[], key: SortKey, asc: boolean): ShiftSessionRow[] {
  const factor = asc ? 1 : -1;
  const value = (row: ShiftSessionRow): string | number => {
    switch (key) {
      case 'employee':
        return row.user_name;
      case 'shift':
        return row.shift_template_name ?? '';
      case 'receipts':
        return row.receipt_count;
      case 'sales':
        return parseMoney(row.sales_total);
      case 'variance':
        return row.cash_difference === null ? 0 : parseMoney(row.cash_difference);
      case 'time':
      default:
        return new Date(row.opened_at).getTime();
    }
  };

  return [...rows].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right) * factor;
    }
    return ((left as number) - (right as number)) * factor;
  });
}
