'use client';

import { Eye, Wallet, X } from 'lucide-react';
import { formatMoney } from '@/common/utils/money';
import { DatePickerButton } from '@/common/components/DatePickerButton';
import { DebtStatusBadge } from './DebtStatusBadge';
import { AgingBucket, DebtStatus } from '../types/debts.types';
import type { DebtListItem } from '../types/debts.types';

/** Whole days since the debt was created — the same clock the aging buckets use. */
function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface DebtsTableCardProps {
  debts: DebtListItem[];
  status: DebtStatus | '';
  agingBucket: AgingBucket | '';
  fromDate: string;
  toDate: string;
  hasFilters: boolean;
  onStatusChange: (value: DebtStatus | '') => void;
  onAgingBucketChange: (value: AgingBucket | '') => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearFilters: () => void;
  onView: (debt: DebtListItem) => void;
  /**
   * Extra toolbar controls, rendered before the clear button. The admin ledger
   * adds a shop filter here; the shop portal has nothing to add.
   */
  extraFilters?: React.ReactNode;
  locale: 'ar' | 'en';
  labels: {
    filters: {
      allStatuses: string;
      allBuckets: string;
      fromDate: string;
      toDate: string;
      clear: string;
    };
    table: {
      debtor: string;
      source: string;
      total: string;
      remaining: string;
      status: string;
      age: string;
      detail: string;
      fromReceipt: string;
      fromOrder: string;
      ageDays: string;
    };
    empty: { title: string; sub: string };
    emptyFiltered: { title: string; sub: string };
    statusNames: Record<DebtStatus, string>;
    bucketNames: Record<AgingBucket, string>;
  };
}

/** "Receipt #21" or "Order #7" — whichever id this debt came from. */
function sourceLabel(debt: DebtListItem, labels: DebtsTableCardProps['labels']): string {
  if (debt.receipt_id != null)
    return labels.table.fromReceipt.replace('{id}', String(debt.receipt_id));
  if (debt.order_id != null) return labels.table.fromOrder.replace('{id}', String(debt.order_id));
  return '—';
}

const GRID = 'grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.1fr_auto_auto]';

export function DebtsTableCard({
  debts,
  status,
  agingBucket,
  fromDate,
  toDate,
  hasFilters,
  onStatusChange,
  onAgingBucketChange,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onView,
  extraFilters,
  locale,
  labels,
}: DebtsTableCardProps) {
  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 border-b border-border">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as DebtStatus | '')}
          className="h-9 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{labels.filters.allStatuses}</option>
          {Object.values(DebtStatus).map((s) => (
            <option key={s} value={s}>
              {labels.statusNames[s]}
            </option>
          ))}
        </select>

        <select
          value={agingBucket}
          onChange={(e) => onAgingBucketChange(e.target.value as AgingBucket | '')}
          className="h-9 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{labels.filters.allBuckets}</option>
          {Object.values(AgingBucket).map((b) => (
            <option key={b} value={b}>
              {labels.bucketNames[b]}
            </option>
          ))}
        </select>

        <DatePickerButton
          value={fromDate}
          onChange={onFromDateChange}
          placeholder={labels.filters.fromDate}
          locale={locale}
        />
        <DatePickerButton
          value={toDate}
          onChange={onToDateChange}
          placeholder={labels.filters.toDate}
          locale={locale}
        />

        {extraFilters}

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors"
          >
            <X size={14} />
            {labels.filters.clear}
          </button>
        )}
      </div>

      {debts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <Wallet size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty.title}
          </p>
          <p className="text-[13px] text-ink-500 max-w-70">
            {hasFilters ? labels.emptyFiltered.sub : labels.empty.sub}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div
              className={`grid ${GRID} items-center gap-4 bg-sand-100 border-b border-border px-6 py-3`}
            >
              {[labels.table.debtor, labels.table.source].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                >
                  {h}
                </span>
              ))}
              {[labels.table.total, labels.table.remaining].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end"
                >
                  {h}
                </span>
              ))}
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.status}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-14 text-end">
                {labels.table.age}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-16 text-center">
                {labels.table.detail}
              </span>
            </div>

            {debts.map((d) => (
              <div
                key={d.id}
                onClick={() => onView(d)}
                className={`grid ${GRID} items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors cursor-pointer`}
              >
                {/* One column — the API already resolved shop vs customer */}
                <span className="text-[14px] font-medium text-ink-900 truncate">
                  {d.debtor_name}
                </span>
                <span className="text-[13px] text-ink-500 truncate">{sourceLabel(d, labels)}</span>
                <span className="font-mono text-[13px] text-ink-600 tabular-nums text-end">
                  {formatMoney(d.total_amount)}
                </span>
                <span className="font-mono text-[13px] font-bold text-amber-700 tabular-nums text-end">
                  {formatMoney(d.remaining)}
                </span>
                <DebtStatusBadge status={d.status} label={labels.statusNames[d.status]} small />
                <span className="font-mono text-[12px] text-ink-500 tabular-nums w-14 text-end">
                  {labels.table.ageDays.replace('{n}', String(ageInDays(d.created_at)))}
                </span>
                <div className="w-16 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onView(d)}
                    aria-label={`${labels.table.detail} — ${d.debtor_name}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-ink-600 hover:bg-sand-100 transition-colors"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col divide-y divide-border">
            {debts.map((d) => (
              <div key={d.id} onClick={() => onView(d)} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink-900 truncate">
                      {d.debtor_name}
                    </span>
                    <span className="block text-[12px] text-ink-400">
                      {sourceLabel(d, labels)}
                      <span className="mx-1.5 text-ink-300">·</span>
                      {formatDate(d.created_at, locale)}
                    </span>
                  </span>
                  <DebtStatusBadge status={d.status} label={labels.statusNames[d.status]} small />
                </div>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-ink-500">
                    {labels.table.remaining}:{' '}
                    <span className="font-mono font-bold text-amber-700 tabular-nums">
                      {formatMoney(d.remaining)}
                    </span>
                  </span>
                  <span className="text-ink-400">
                    {labels.table.total}:{' '}
                    <span className="font-mono tabular-nums">{formatMoney(d.total_amount)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
