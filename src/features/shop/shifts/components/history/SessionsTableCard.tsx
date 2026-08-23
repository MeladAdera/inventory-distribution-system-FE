'use client';

import { Info, Loader2 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped } from '@/common/utils/money';
import type { ShiftSessionRow } from '../../types/shifts.types';
import { CashDifference } from './CashDifference';

export interface SessionsTableLabels {
  loading: string;
  empty: string;
  cols: {
    date: string;
    employee: string;
    shift: string;
    opened: string;
    closed: string;
    sold: string;
    inDrawer: string;
    counted: string;
    difference: string;
  };
  soldVsDrawer: string;
  noSlot: string;
  closedBy: string;
  stillOpen: string;
  notCounted: string;
}

interface SessionsTableCardProps {
  /** Already grouped by trading day, newest first — see useShiftSessions. */
  byBusinessDate: Map<string, ShiftSessionRow[]>;
  isLoading: boolean;
  locale: string;
  currency: string;
  /** id → name, for `closed_by`. The API returns the id alone. */
  userNames: Map<number, string>;
  onSelect: (session: ShiftSessionRow) => void;
  labels: SessionsTableLabels;
}

export function SessionsTableCard({
  byBusinessDate,
  isLoading,
  locale,
  currency,
  userNames,
  onSelect,
  labels,
}: SessionsTableCardProps) {
  const groups = Array.from(byBusinessDate.entries());

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{labels.loading}</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return <p className="py-12 text-center text-[14px] text-ink-400">{labels.empty}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-paper">
      {/* Sold and expected cash are different numbers and a gap between them is
          not a discrepancy — say so once, above the table, rather than letting
          every credit sale look like a shortfall. */}
      <p className="flex items-start gap-2 border-b border-border bg-sand-100/60 px-4 py-2.5 text-[12px] leading-relaxed text-ink-500">
        <Info size={14} className="mt-0.5 shrink-0" />
        {labels.soldVsDrawer}
      </p>

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <table className="hidden w-full text-[13px] md:table">
        <thead>
          <tr className="border-b border-border text-[12px] text-ink-500">
            <Th>{labels.cols.employee}</Th>
            <Th>{labels.cols.shift}</Th>
            <Th>{labels.cols.opened}</Th>
            <Th>{labels.cols.closed}</Th>
            <Th align="end">{labels.cols.sold}</Th>
            <Th align="end">{labels.cols.inDrawer}</Th>
            <Th align="end">{labels.cols.counted}</Th>
            <Th align="end">{labels.cols.difference}</Th>
          </tr>
        </thead>
        {groups.map(([date, rows]) => (
          <tbody key={date}>
            <tr>
              <td
                colSpan={8}
                className="bg-page px-4 py-1.5 text-[12px] font-semibold text-ink-600"
              >
                {formatBusinessDate(date, locale)}
              </td>
            </tr>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-sand-100/60"
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-ink-800">{row.user_name}</p>
                  <ClosedBy row={row} userNames={userNames} labels={labels} />
                </td>
                <td className="px-4 py-2.5 text-ink-600">
                  {row.shift_template_name ?? <span className="text-ink-400">{labels.noSlot}</span>}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-ink-600" dir="ltr">
                  {formatTime(row.opened_at, locale)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-ink-600" dir="ltr">
                  {row.closed_at ? (
                    formatTime(row.closed_at, locale)
                  ) : (
                    <span className="text-amber-700">{labels.stillOpen}</span>
                  )}
                </td>
                <Money value={row.sales_total} currency={currency} />
                <Money value={row.expected_cash} currency={currency} muted />
                <Money value={row.counted_cash} currency={currency} />
                <td className="px-4 py-2.5 text-end">
                  <CashDifference value={row.cash_difference} placeholder={labels.notCounted} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      {/* ── Mobile ──────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        {groups.map(([date, rows]) => (
          <div key={date}>
            <p className="bg-page px-4 py-1.5 text-[12px] font-semibold text-ink-600">
              {formatBusinessDate(date, locale)}
            </p>
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row)}
                className="block w-full border-b border-border px-4 py-3 text-start last:border-0 active:bg-sand-100/60"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-[14px] font-medium text-ink-800">
                    {row.user_name}
                  </p>
                  <span
                    className="whitespace-nowrap text-[12px] tabular-nums text-ink-500"
                    dir="ltr"
                  >
                    {formatTime(row.opened_at, locale)}
                    {row.closed_at ? ` – ${formatTime(row.closed_at, locale)}` : ''}
                  </span>
                </div>

                <p className="mt-0.5 text-[12px] text-ink-500">
                  {row.shift_template_name ?? labels.noSlot}
                  {!row.closed_at && (
                    <span className="ms-2 text-amber-700">{labels.stillOpen}</span>
                  )}
                </p>
                <ClosedBy row={row} userNames={userNames} labels={labels} />

                <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                  <Cell label={labels.cols.sold}>
                    <span className="tabular-nums text-ink-700">
                      {formatMoneyGrouped(row.sales_total)}
                    </span>
                  </Cell>
                  <Cell label={labels.cols.inDrawer}>
                    <span className="tabular-nums text-ink-500">
                      {row.expected_cash
                        ? formatMoneyGrouped(row.expected_cash)
                        : labels.notCounted}
                    </span>
                  </Cell>
                  <Cell label={labels.cols.difference}>
                    <CashDifference
                      value={row.cash_difference}
                      placeholder={labels.notCounted}
                      className="text-[12px]"
                    />
                  </Cell>
                </dl>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────

function Th({ children, align = 'start' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return (
    <th className={cn('px-4 py-2 font-medium', align === 'end' ? 'text-end' : 'text-start')}>
      {children}
    </th>
  );
}

function Money({
  value,
  currency,
  muted = false,
}: {
  value: string | null;
  currency: string;
  muted?: boolean;
}) {
  return (
    <td
      className={cn('px-4 py-2.5 text-end tabular-nums', muted ? 'text-ink-500' : 'text-ink-700')}
    >
      {value === null ? (
        <span className="text-ink-400">—</span>
      ) : (
        <span dir="ltr">
          {formatMoneyGrouped(value)} {currency}
        </span>
      )}
    </td>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="truncate text-[11px] text-ink-400">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

/**
 * "closed by Sara" on Ahmad's shift — the row an owner most wants to see.
 *
 * Rendered only when the counter differs from whose shift it was. The API gives
 * `closed_by` as a bare id with no name, so it is resolved against the shop's
 * user list; an id that cannot be resolved shows nothing rather than a number.
 */
function ClosedBy({
  row,
  userNames,
  labels,
}: {
  row: ShiftSessionRow;
  userNames: Map<number, string>;
  labels: { closedBy: string };
}) {
  if (row.closed_by === null || row.closed_by === row.user_id) return null;
  const name = userNames.get(row.closed_by);
  if (!name) return null;
  return (
    <p className="mt-0.5 text-[11px] text-ink-400">{labels.closedBy.replace('{name}', name)}</p>
  );
}

// ── Formatting ────────────────────────────────────────────────────────────

/**
 * `business_date` is a plain `YYYY-MM-DD` with no zone. Parsing it as a Date
 * would drag it through the browser's timezone and can shift the label a day,
 * so the parts are fed to the formatter as UTC noon instead.
 */
function formatBusinessDate(date: string, locale: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso)
  );
}

export { formatBusinessDate };
