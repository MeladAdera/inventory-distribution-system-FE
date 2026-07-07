'use client';

import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useReceipts, ReceiptDetailModal } from '@/features/shared/receipts';
import { TypewriterText } from '@/common/components/TypewriterText';
import { ReceiptsTableCard } from './receipts/ReceiptsTableCard';
import type { ReceiptListItem } from '@/features/shared/receipts';

const LIMIT = 15;

export function ClientReceiptsPage() {
  const { t, locale } = useI18n();
  const r = t.client.receipts;

  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const params = {
    page,
    limit: LIMIT,
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const { receipts, total, totalPages, isLoading, error } = useReceipts(params);

  function handleFromDateChange(value: string) {
    setFromDate(value);
    setPage(1);
  }

  function handleToDateChange(value: string) {
    setToDate(value);
    setPage(1);
  }

  function handleClearFilters() {
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  function handleView(receipt: ReceiptListItem) {
    setSelectedReceipt(receipt);
    setModalOpen(true);
  }

  if (isLoading && receipts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{r.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{r.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="mb-5.5">
        <h1 className="text-[26px] font-semibold text-ink-900">
          <TypewriterText phrases={r.taglines} />
        </h1>
        <p className="text-[14px] text-ink-500 mt-1">
          {total} {r.title.toLowerCase()}
        </p>
      </div>

      <ReceiptsTableCard
        receipts={receipts}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        onClearFilters={handleClearFilters}
        onView={handleView}
        locale={locale}
        labels={{
          filter: r.filter,
          table: r.table,
          empty: r.empty,
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[13px] text-ink-400">
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            <span className="h-9 px-3 flex items-center text-[13px] text-ink-600 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <ReceiptDetailModal
        receiptId={selectedReceipt?.id ?? null}
        createdByName={selectedReceipt?.created_by_name}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locale={locale}
        labels={r.modal}
      />
    </div>
  );
}
