'use client';

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped, parseMoney } from '@/common/utils/money';
import { useI18n } from '@/providers/I18nProvider';
import type { ShiftSessionRow } from '../../types/shifts.types';
import type { SortDir, SortKey } from '../../hooks/useHistoryFilters';
import { StatusBadge } from '../ui/StatusBadge';
import { VarianceValue } from '../ui/VarianceValue';

/**
 * A variance worth a second look: more than a tenth of what the drawer should
 * have held. Proportional rather than a flat amount so it means the same thing
 * whether a till turns over 200 a night or 20,000.
 */
const ATTENTION_RATIO = 0.1;

export function needsAttention(row: ShiftSessionRow): 'surplus' | 'shortfall' | null {
  if (row.cash_difference === null || row.expected_cash === null) return null;
  const expected = Math.abs(parseMoney(row.expected_cash));
  const diff = parseMoney(row.cash_difference);
  if (expected <= 0 || Math.abs(diff) < expected * ATTENTION_RATIO) return null;
  return diff > 0 ? 'surplus' : 'shortfall';
}

/** "Sold (ل.س)" — the unit belongs in the header, not in every cell. */
function withUnit(label: string, currency: string): string {
  return `${label} (${currency})`;
}

export interface SessionsTableLabels {
  cols: {
    employee: string;
    shift: string;
    opened: string;
    duration: string;
    receipts: string;
    sold: string;
    difference: string;
    status: string;
  };
  states: { completed: string; open: string };
  noSlot: string;
  closedBy: string;
  stillOpen: string;
  notCounted: string;
  details: string;
  pageOnlyNote: string;
  attention: { surplus: string; shortfall: string };
}

interface Props {
  rows: ShiftSessionRow[];
  /** Rows already grouped by trading day, in display order. */
  groups: [string, ShiftSessionRow[]][];
  sortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelect: (row: ShiftSessionRow) => void;
  userNames: Map<number, string>;
  currency: string;
  formatDay: (date: string) => string;
  formatTime: (iso: string) => string;
  labels: SessionsTableLabels;
}

export function SessionsTable({
  groups,
  sortKey,
  sortDir,
  onSort,
  onSelect,
  userNames,
  currency,
  formatDay,
  formatTime,
  labels,
}: Props) {
  const { dir } = useI18n();
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const sortProps = { active: sortKey, sortDir, onSort };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-paper">
      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-subtle">
            <tr className="border-b border-border text-[11.5px] text-ink-500">
              <Th col="employee" {...sortProps}>
                {labels.cols.employee}
              </Th>
              <Th col="shift" {...sortProps}>
                {labels.cols.shift}
              </Th>
              <Th col="time" {...sortProps}>
                {labels.cols.opened}
              </Th>
              <Th col="receipts" align="end" {...sortProps}>
                {labels.cols.receipts}
              </Th>
              {/* The unit is stated once here rather than repeated in every
                  row. That keeps the cells pure digits — no Arabic inside an
                  LTR run, no dir needed on the cell, and a narrower column
                  whose numbers are far easier to scan down. */}
              <Th col="sales" align="end" {...sortProps}>
                {withUnit(labels.cols.sold, currency)}
              </Th>
              <Th col="variance" align="end" {...sortProps}>
                {withUnit(labels.cols.difference, currency)}
              </Th>
              <th className="px-4 py-2 text-start font-medium">{labels.cols.status}</th>
              <th className="w-8" />
            </tr>
          </thead>

          {groups.map(([date, rows]) => (
            <tbody key={date}>
              <tr>
                <td
                  colSpan={8}
                  className="bg-page px-4 py-1.5 text-[12px] font-semibold text-ink-600"
                >
                  {formatDay(date)}
                </td>
              </tr>
              {rows.map((row) => {
                const attention = needsAttention(row);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-subtle"
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink-800">{row.user_name}</p>
                      <ClosedBy row={row} userNames={userNames} label={labels.closedBy} />
                    </td>
                    <td className="px-4 py-2.5">
                      {row.shift_template_name ?? (
                        /* Faint so real shift names read first in a mixed list. */
                        <span className="text-ink-faint">{labels.noSlot}</span>
                      )}
                    </td>
                    {/* dir="ltr" goes on the SPAN, never on the td. On the td it
                        also flips what text-start/text-end mean for that cell,
                        so the value aligned to one edge while its header — still
                        in the page's direction — aligned to the other. */}
                    <td className="px-4 py-2.5 tabular-nums text-ink-600">
                      <span dir="ltr">
                        {formatTime(row.opened_at)}
                        {row.closed_at ? `–${formatTime(row.closed_at)}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums text-ink-700">
                      {row.receipt_count}
                    </td>
                    <td className="px-4 py-2.5 text-end tabular-nums text-ink-700">
                      {formatMoneyGrouped(row.sales_total)}
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      <VarianceValue value={row.cash_difference} placeholder={labels.notCounted} />
                      {attention && (
                        <span
                          className="ms-1 align-middle text-ink-400"
                          title={labels.attention[attention]}
                        >
                          <Info size={12} className="inline" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        kind={row.closed_at ? 'completed' : 'open'}
                        label={row.closed_at ? labels.states.completed : labels.states.open}
                      />
                    </td>
                    <td className="pe-3 text-ink-300">
                      <Chevron size={15} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      {/* ── Mobile ──────────────────────────────────────────────────────── */}
      <div className="md:hidden">
        {groups.map(([date, rows]) => (
          <div key={date}>
            <p className="bg-page px-4 py-1.5 text-[12px] font-semibold text-ink-600">
              {formatDay(date)}
            </p>
            {rows.map((row) => {
              const attention = needsAttention(row);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelect(row)}
                  className="block w-full border-b border-border px-4 py-3 text-start last:border-0 active:bg-subtle"
                >
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge
                      kind={row.closed_at ? 'completed' : 'open'}
                      label={row.closed_at ? labels.states.completed : labels.states.open}
                    />
                    <p className="min-w-0 truncate text-[14.5px] font-semibold text-ink-900">
                      {row.user_name}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-[12px] text-ink-500">
                    <span className={cn(!row.shift_template_name && 'text-ink-faint')}>
                      {row.shift_template_name ?? labels.noSlot}
                    </span>
                    <span dir="ltr" className="ms-1.5 tabular-nums">
                      · {formatTime(row.opened_at)}
                      {row.closed_at ? ` – ${formatTime(row.closed_at)}` : ''}
                    </span>
                  </p>
                  <ClosedBy row={row} userNames={userNames} label={labels.closedBy} />

                  <dl className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                    <Metric label={labels.cols.receipts}>
                      <span className="tabular-nums text-ink-800">{row.receipt_count}</span>
                    </Metric>
                    <Metric label={withUnit(labels.cols.sold, currency)}>
                      <span dir="ltr" className="tabular-nums text-ink-800">
                        {formatMoneyGrouped(row.sales_total)}
                      </span>
                    </Metric>
                    <Metric label={withUnit(labels.cols.difference, currency)}>
                      <VarianceValue
                        value={row.cash_difference}
                        placeholder={labels.notCounted}
                        className="text-[13px]"
                      />
                    </Metric>
                  </dl>

                  {/* Anything that needs a human decision says so in the card,
                      rather than leaving a bare number to be interpreted. */}
                  {attention && (
                    <p className="mt-2 rounded-lg border border-warning-200 bg-warning-50 px-2.5 py-1.5 text-[11.5px] text-warning-700">
                      {labels.attention[attention]}
                    </p>
                  )}

                  <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-amber-700">
                    {labels.details}
                    <Chevron size={13} />
                  </p>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="border-t border-border bg-subtle px-4 py-2 text-[11.5px] text-ink-400">
        {labels.pageOnlyNote}
      </p>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────

function Th({
  children,
  col,
  active,
  sortDir,
  onSort,
  align = 'start',
}: {
  children: React.ReactNode;
  col: SortKey;
  active: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'start' | 'end';
}) {
  const isActive = active === col;
  const Arrow = sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={cn('px-4 py-2 font-medium', align === 'end' ? 'text-end' : 'text-start')}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-ink-800',
          align === 'end' && 'flex-row-reverse',
          isActive && 'font-semibold text-ink-800'
        )}
      >
        {children}
        {isActive && <Arrow size={12} />}
      </button>
    </th>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

/**
 * "closed by Sara" on Ahmad's shift. The API gives `closed_by` as a bare id, so
 * it is resolved against the shop's people and simply omitted when it cannot be
 * — never rendered as a number.
 */
function ClosedBy({
  row,
  userNames,
  label,
}: {
  row: ShiftSessionRow;
  userNames: Map<number, string>;
  label: string;
}) {
  if (row.closed_by === null || row.closed_by === row.user_id) return null;
  const name = userNames.get(row.closed_by);
  if (!name) return null;
  return <p className="mt-0.5 text-[11px] text-ink-400">{label.replace('{name}', name)}</p>;
}
