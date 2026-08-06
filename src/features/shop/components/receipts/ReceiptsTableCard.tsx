'use client';

import { Eye, ReceiptText, Search, X } from 'lucide-react';
import { DateRangeChip, FilterChips } from '@/common/components';
import { cn } from '@/common/utils/cn';
import { isThisWeek } from '@/common/utils/date.utils';
import { ReceiptView } from '@/features/shared/receipts';
import type { ReceiptListItem } from '@/features/shared/receipts';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export interface ReceiptsTableLabels {
  searchPlaceholder: string;
  views: Record<'all' | 'thisWeek' | 'withNotes', string>;
  groups: { thisWeek: string; earlier: string };
  footer: string;
  filter: { fromDate: string; toDate: string; clear: string };
  table: {
    receiptNo: string;
    date: string;
    items: string;
    notes: string;
    details: string;
    viewBtn: string;
    itemsUnit: string;
    noNotes: string;
    freeBadge: string;
    cancelledBadge: string;
  };
  empty: { title: string; sub: string };
  emptyFiltered: { title: string; sub: string };
}

interface ReceiptsTableCardProps {
  /** Already narrowed by search and the view chips. */
  receipts: ReceiptListItem[];
  /** Matching the server-side filters, across all pages — for the footer. */
  total: number;
  search: string;
  view: ReceiptView;
  fromDate: string;
  toDate: string;
  hasFilters: boolean;
  onSearchChange: (v: string) => void;
  onViewChange: (v: ReceiptView) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onClearFilters: () => void;
  onView: (receipt: ReceiptListItem) => void;
  locale: 'ar' | 'en';
  labels: ReceiptsTableLabels;
}

const VIEW_ORDER: { value: ReceiptView; key: 'all' | 'thisWeek' | 'withNotes' }[] = [
  { value: ReceiptView.ALL, key: 'all' },
  { value: ReceiptView.THIS_WEEK, key: 'thisWeek' },
  { value: ReceiptView.WITH_NOTES, key: 'withNotes' },
];

/** The receipt's own number, the thing a shop owner reads a row by. */
function ReceiptNoChip({ id, large }: { id: number; large?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-lg bg-sand-100 border border-border font-mono font-bold text-ink-800 leading-none',
        large ? 'text-[15px]' : 'text-[13px]'
      )}
    >
      #{id}
    </span>
  );
}

/**
 * A note is the only free-text on a receipt and usually explains an exception —
 * a partial delivery, a damaged box. Tinting it makes those rows findable while
 * scrolling, which a grey line of text never is.
 */
function NoteChip({ note }: { note: string }) {
  return (
    <span className="inline-block max-w-full truncate px-2 py-1 rounded-md bg-amber-50 text-[12px] text-amber-700 align-middle">
      {note}
    </span>
  );
}

function StateBadges({
  receipt,
  labels,
}: {
  receipt: ReceiptListItem;
  labels: ReceiptsTableLabels;
}) {
  return (
    <>
      {receipt.is_free && (
        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium shrink-0">
          {labels.table.freeBadge}
        </span>
      )}
      {receipt.is_cancelled && (
        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-danger-100 text-danger-700 text-[10px] font-medium shrink-0">
          {labels.table.cancelledBadge}
        </span>
      )}
    </>
  );
}

function ViewButton({
  onClick,
  label,
  variant,
}: {
  onClick: () => void;
  label: string;
  variant: 'outline' | 'solid';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer',
        variant === 'outline'
          ? 'px-3 h-8 border border-border text-ink-700 hover:bg-sand-100'
          : 'px-4 h-9 bg-ink-900 text-amber-500 font-semibold hover:bg-ink-800'
      )}
    >
      <Eye size={14} />
      {label}
    </button>
  );
}

export function ReceiptsTableCard({
  receipts,
  total,
  search,
  view,
  fromDate,
  toDate,
  hasFilters,
  onSearchChange,
  onViewChange,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onView,
  locale,
  labels,
}: ReceiptsTableCardProps) {
  // Mobile groups by recency instead of repeating the full date on every card.
  const thisWeek = receipts.filter((r) => isThisWeek(r.created_at));
  const earlier = receipts.filter((r) => !isThisWeek(r.created_at));

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-border">
        <div className="relative flex-1 min-w-50 order-1">
          <Search
            size={15}
            className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full h-9 ps-9 pe-3 border border-border rounded-lg text-[13px] text-ink-800 placeholder:text-ink-400 bg-paper outline-none focus:border-amber-500"
          />
        </div>

        <div className="order-3 sm:order-2">
          <DateRangeChip
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={onFromDateChange}
            onToChange={onToDateChange}
            onClear={() => {
              onFromDateChange('');
              onToDateChange('');
            }}
            locale={locale}
            labels={{
              from: labels.filter.fromDate,
              to: labels.filter.toDate,
              clear: labels.filter.clear,
            }}
          />
        </div>

        <div className="order-2 sm:order-3 w-full sm:w-auto">
          <FilterChips
            value={view}
            onChange={onViewChange}
            options={VIEW_ORDER.map((o) => ({ value: o.value, label: labels.views[o.key] }))}
          />
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <ReceiptText size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty.title}
          </p>
          <p className="text-[13px] text-ink-500 max-w-70">
            {hasFilters ? labels.emptyFiltered.sub : labels.empty.sub}
          </p>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="mt-1 flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              <X size={14} />
              {labels.filter.clear}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[auto_1.3fr_0.7fr_1.4fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20">
                {labels.table.receiptNo}
              </span>
              {[labels.table.date, labels.table.items, labels.table.notes].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                >
                  {h}
                </span>
              ))}
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20 text-center">
                {labels.table.details}
              </span>
            </div>

            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => onView(receipt)}
                className="grid grid-cols-[auto_1.3fr_0.7fr_1.4fr_auto] items-center gap-4 px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-page transition-colors cursor-pointer"
              >
                <span className="w-20">
                  <ReceiptNoChip id={receipt.id} />
                </span>

                <span className="flex items-center gap-2 text-[13px] text-ink-600 min-w-0">
                  <span className="truncate">{formatDate(receipt.created_at, locale)}</span>
                  <span className="text-ink-400 tabular-nums shrink-0">
                    {formatTime(receipt.created_at, locale)}
                  </span>
                  <StateBadges receipt={receipt} labels={labels} />
                </span>

                <span className="text-[13px] text-ink-600">
                  {receipt.total_items} {labels.table.itemsUnit}
                </span>

                <span className="min-w-0">
                  {receipt.notes ? (
                    <NoteChip note={receipt.notes} />
                  ) : (
                    <span className="text-[13px] text-ink-300">{labels.table.noNotes}</span>
                  )}
                </span>

                <div className="w-20 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <ViewButton
                    onClick={() => onView(receipt)}
                    label={labels.table.viewBtn}
                    variant="outline"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden">
            {(
              [
                { key: 'thisWeek' as const, rows: thisWeek },
                { key: 'earlier' as const, rows: earlier },
              ] satisfies { key: 'thisWeek' | 'earlier'; rows: ReceiptListItem[] }[]
            ).map(({ key, rows }) =>
              rows.length === 0 ? null : (
                <div key={key}>
                  {/* Only worth a heading when there is something to separate. */}
                  {thisWeek.length > 0 && earlier.length > 0 && (
                    <p className="px-4 pt-3 pb-1 text-[12px] font-medium text-ink-400">
                      {labels.groups[key]}
                    </p>
                  )}
                  <div className="flex flex-col gap-2.5 px-3 pb-3 pt-1">
                    {rows.map((receipt) => (
                      <div
                        key={receipt.id}
                        onClick={() => onView(receipt)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border bg-paper"
                      >
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <span className="flex items-center gap-2 flex-wrap">
                            <ReceiptNoChip id={receipt.id} large />
                            <span className="text-[13px] text-ink-600">
                              {receipt.total_items} {labels.table.itemsUnit}
                            </span>
                            <StateBadges receipt={receipt} labels={labels} />
                          </span>

                          <span className="text-[12px] text-ink-500">
                            {formatDate(receipt.created_at, locale)}
                            <span className="mx-1.5 text-ink-300">·</span>
                            <span className="tabular-nums">
                              {formatTime(receipt.created_at, locale)}
                            </span>
                          </span>

                          {receipt.notes && (
                            <span className="min-w-0">
                              <NoteChip note={receipt.notes} />
                            </span>
                          )}
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <ViewButton
                            onClick={() => onView(receipt)}
                            label={labels.table.viewBtn}
                            variant="solid"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 border-t border-border bg-page">
            <p className="text-[12px] text-ink-400">
              {labels.footer
                .replace('{shown}', String(receipts.length))
                .replace('{total}', String(total))}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
