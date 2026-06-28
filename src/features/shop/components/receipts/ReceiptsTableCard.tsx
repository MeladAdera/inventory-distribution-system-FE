import { Eye, ReceiptText } from 'lucide-react';
import { DatePickerButton } from '@/common/components';
import type { ReceiptListItem } from '@/features/shared/receipts';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

interface ReceiptsTableCardProps {
  receipts: ReceiptListItem[];
  fromDate: string;
  toDate: string;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onClearFilters: () => void;
  onView: (receipt: ReceiptListItem) => void;
  locale: 'ar' | 'en';
  labels: {
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
    };
    empty: { title: string; sub: string };
  };
}

export function ReceiptsTableCard({
  receipts,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onView,
  locale,
  labels,
}: ReceiptsTableCardProps) {
  const hasFilters = fromDate !== '' || toDate !== '';

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar — mobile */}
      <div className="sm:hidden flex flex-col gap-2 px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <DatePickerButton
            value={fromDate}
            onChange={onFromDateChange}
            placeholder={labels.filter.fromDate}
            locale={locale}
            className="flex-1 justify-center"
          />
          <span className="text-ink-300 text-sm shrink-0">—</span>
          <DatePickerButton
            value={toDate}
            onChange={onToDateChange}
            placeholder={labels.filter.toDate}
            locale={locale}
            className="flex-1 justify-center"
          />
        </div>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="self-start text-[13px] text-amber-700 font-medium hover:text-amber-900 transition-colors"
          >
            {labels.filter.clear}
          </button>
        )}
      </div>

      {/* Toolbar — desktop */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        <DatePickerButton
          value={fromDate}
          onChange={onFromDateChange}
          placeholder={labels.filter.fromDate}
          locale={locale}
        />
        <span className="text-ink-300">—</span>
        <DatePickerButton
          value={toDate}
          onChange={onToDateChange}
          placeholder={labels.filter.toDate}
          locale={locale}
        />

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="h-9 px-3 text-[13px] text-ink-500 hover:text-ink-800 underline underline-offset-2 transition-colors"
          >
            {labels.filter.clear}
          </button>
        )}
      </div>

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <ReceiptText size={32} className="text-ink-400" />
          <p className="text-[15px] font-medium text-ink-700">{labels.empty.title}</p>
          <p className="text-[13px] text-ink-400 max-w-xs">{labels.empty.sub}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[auto_1fr_0.6fr_1.4fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-24">
                {labels.table.receiptNo}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.date}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.items}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.notes}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-16 text-center">
                {labels.table.details}
              </span>
            </div>

            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="grid grid-cols-[auto_1fr_0.6fr_1.4fr_auto] items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors"
              >
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sand-100 border border-border w-24">
                  <span className="text-[11px] text-ink-500">{labels.table.receiptNo}</span>
                  <span className="font-mono text-[13px] font-bold text-ink-800">{receipt.id}</span>
                </span>
                <span className="text-[13px] text-ink-600">
                  {formatDate(receipt.created_at, locale)}
                </span>
                <span className="text-[13px] text-ink-600">
                  {receipt.total_items} {labels.table.itemsUnit}
                </span>
                <span className="text-[13px] text-ink-400 truncate">
                  {receipt.notes ?? labels.table.noNotes}
                </span>
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => onView(receipt)}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                  >
                    <Eye size={14} />
                    {labels.table.viewBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="px-5 py-4 flex flex-col gap-2.5">
                {/* Row 1: receipt ID chip + view button */}
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-100 border border-border leading-none">
                    <span className="text-[12px] text-ink-500">{labels.table.receiptNo}</span>
                    <span className="font-mono text-[15px] font-bold text-ink-900">
                      {receipt.id}
                    </span>
                  </span>
                  <button
                    onClick={() => onView(receipt)}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-ink-900 text-amber-500 text-[13px] font-semibold hover:bg-ink-800 transition-colors shrink-0"
                  >
                    <Eye size={14} />
                    {labels.table.viewBtn}
                  </button>
                </div>

                {/* Row 2: items count · date */}
                <p className="text-[13px] text-ink-600">
                  {receipt.total_items} {labels.table.itemsUnit}
                  <span className="mx-2 text-ink-300">·</span>
                  {formatDate(receipt.created_at, locale)}
                </p>

                {/* Row 3: notes (if any) */}
                {receipt.notes && (
                  <p className="text-[12px] text-ink-400 italic line-clamp-2">{receipt.notes}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
