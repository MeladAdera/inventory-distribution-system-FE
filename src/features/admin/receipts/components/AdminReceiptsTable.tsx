'use client';

import { Eye, ReceiptText, Search, X } from 'lucide-react';
import { DateRangeChip, FilterChips } from '@/common/components';
import { cn } from '@/common/utils/cn';
import { ReceiptView } from '@/features/shared/receipts';
import type { ReceiptListItem } from '@/features/shared/receipts';
import type { Shop } from '@/features/admin/shops';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatTime(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export interface AdminReceiptsTableLabels {
  searchPlaceholder: string;
  views: Record<'all' | 'thisWeek' | 'withNotes', string>;
  footer: string;
  filter: { allShops: string; fromDate: string; toDate: string; clear: string };
  table: {
    receiptNo: string;
    date: string;
    shop: string;
    createdBy: string;
    items: string;
    notes: string;
    detail: string;
    itemsUnit: string;
    noNotes: string;
  };
  empty: string;
  emptyFiltered: { title: string; sub: string };
  freeBadge: string;
  cancelledBadge: string;
}

interface AdminReceiptsTableProps {
  /** Already narrowed by search and the view chips. */
  receipts: ReceiptListItem[];
  /** Matching the server-side filters, across all pages — for the footer. */
  total: number;
  isLoading: boolean;
  search: string;
  view: ReceiptView;
  shopId: string;
  shops: Shop[];
  fromDate: string;
  toDate: string;
  hasFilters: boolean;
  onSearchChange: (v: string) => void;
  onViewChange: (v: ReceiptView) => void;
  onShopChange: (v: string) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onClearFilters: () => void;
  onView: (receipt: ReceiptListItem) => void;
  locale: 'ar' | 'en';
  labels: AdminReceiptsTableLabels;
}

const VIEW_ORDER: { value: ReceiptView; key: 'all' | 'thisWeek' | 'withNotes' }[] = [
  { value: ReceiptView.ALL, key: 'all' },
  { value: ReceiptView.THIS_WEEK, key: 'thisWeek' },
  { value: ReceiptView.WITH_NOTES, key: 'withNotes' },
];

function ReceiptNoChip({
  id,
  cancelled,
  large,
}: {
  id: number;
  cancelled: boolean;
  large?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-lg bg-sand-100 border border-border font-mono font-bold leading-none',
        large ? 'text-[15px]' : 'text-[13px]',
        cancelled ? 'text-ink-400 line-through' : 'text-ink-800'
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
    <span
      title={note}
      className="inline-block max-w-full truncate px-2 py-1 rounded-md bg-amber-50 text-[12px] text-amber-700 align-middle"
    >
      {note}
    </span>
  );
}

function StateBadges({
  receipt,
  labels,
}: {
  receipt: ReceiptListItem;
  labels: AdminReceiptsTableLabels;
}) {
  return (
    <>
      {receipt.is_free && (
        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium shrink-0">
          {labels.freeBadge}
        </span>
      )}
      {receipt.is_cancelled && (
        <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-danger-100 text-danger-700 text-[10px] font-medium shrink-0">
          {labels.cancelledBadge}
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

const GRID = 'grid grid-cols-[auto_1.3fr_1.1fr_0.6fr_1.2fr_auto] items-center gap-4';

export function AdminReceiptsTable({
  receipts,
  total,
  isLoading,
  search,
  view,
  shopId,
  shops,
  fromDate,
  toDate,
  hasFilters,
  onSearchChange,
  onViewChange,
  onShopChange,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onView,
  locale,
  labels,
}: AdminReceiptsTableProps) {
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

        {/* Server-side, unlike the chips — it is the one filter that has to
            reach past the page the admin is looking at. */}
        <select
          value={shopId}
          onChange={(e) => onShopChange(e.target.value)}
          className="order-3 sm:order-2 h-9 px-3 max-w-45 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">{labels.filter.allShops}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>

        <div className="order-4 sm:order-3">
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

        <div className="order-2 sm:order-4 w-full sm:w-auto">
          <FilterChips
            value={view}
            onChange={onViewChange}
            options={VIEW_ORDER.map((o) => ({ value: o.value, label: labels.views[o.key] }))}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <ReceiptText size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty}
          </p>
          {hasFilters && (
            <>
              <p className="text-[13px] text-ink-500 max-w-70">{labels.emptyFiltered.sub}</p>
              <button
                onClick={onClearFilters}
                className="mt-1 flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
              >
                <X size={14} />
                {labels.filter.clear}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className={cn(GRID, 'bg-sand-100 border-b border-border px-6 py-3')}>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20">
                {labels.table.receiptNo}
              </span>
              {[labels.table.shop, labels.table.date, labels.table.items, labels.table.notes].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                  >
                    {h}
                  </span>
                )
              )}
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20 text-center">
                {labels.table.detail}
              </span>
            </div>

            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => onView(receipt)}
                className={cn(
                  GRID,
                  'px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-page transition-colors cursor-pointer'
                )}
              >
                <span className="w-20 flex items-center gap-1.5">
                  <ReceiptNoChip id={receipt.id} cancelled={receipt.is_cancelled} />
                </span>

                {/* Who raised it matters as much as where, and the two only
                    make sense together — so they share a cell. */}
                <span className="min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium text-ink-900 truncate">
                      {receipt.shop_name}
                    </span>
                    <StateBadges receipt={receipt} labels={labels} />
                  </span>
                  <span className="block text-[11px] text-ink-400 truncate">
                    {receipt.created_by_name}
                  </span>
                </span>

                <span className="flex items-center gap-2 text-[13px] text-ink-600 min-w-0">
                  <span className="truncate">{formatDate(receipt.created_at, locale)}</span>
                  <span className="text-ink-400 tabular-nums shrink-0">
                    {formatTime(receipt.created_at, locale)}
                  </span>
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
                    label={labels.table.detail}
                    variant="outline"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-2.5 px-3 py-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                onClick={() => onView(receipt)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-paper"
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 flex-wrap">
                    <ReceiptNoChip id={receipt.id} cancelled={receipt.is_cancelled} large />
                    <span className="text-[13px] text-ink-600">
                      {receipt.total_items} {labels.table.itemsUnit}
                    </span>
                    <StateBadges receipt={receipt} labels={labels} />
                  </span>

                  <span className="block text-[13px] font-medium text-ink-900 truncate">
                    {receipt.shop_name}
                  </span>

                  <span className="text-[12px] text-ink-500">
                    {receipt.created_by_name}
                    <span className="mx-1.5 text-ink-300">·</span>
                    {formatDate(receipt.created_at, locale)}
                    <span className="mx-1.5 text-ink-300">·</span>
                    <span className="tabular-nums">{formatTime(receipt.created_at, locale)}</span>
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
                    label={labels.table.detail}
                    variant="solid"
                  />
                </div>
              </div>
            ))}
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
