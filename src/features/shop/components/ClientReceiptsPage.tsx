'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Download, ReceiptText } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { StatCard, StatCardGrid } from '@/common/components';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { isThisWeek } from '@/common/utils/date.utils';
import { useReceipts, ReceiptDetailModal } from '@/features/shared/receipts';
import { useReceiptStats } from '../hooks/useReceiptStats';
import { ReceiptsTableCard } from './receipts/ReceiptsTableCard';
import { ReceiptView } from '../types/clientReceipts.types';
import type { ReceiptListItem } from '@/features/shared/receipts';

const LIMIT = 15;

export function ClientReceiptsPage() {
  const { t, locale } = useI18n();
  const r = t.client.receipts;
  const toast = useToast();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ReceiptView>(ReceiptView.ALL);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [page, fromDate, toDate]
  );

  const { receipts, total, totalPages, isLoading, error } = useReceipts(params);
  const { stats, isLoading: isLoadingStats } = useReceiptStats();

  /**
   * Search and the view chips narrow what is on screen; the date range is the
   * only filter the API understands, so it alone changes which page is fetched.
   * The card footer reports both counts so the gap is never silent.
   */
  const visibleReceipts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (view === ReceiptView.THIS_WEEK && !isThisWeek(receipt.created_at)) return false;
      if (view === ReceiptView.WITH_NOTES && !receipt.notes) return false;
      if (!query) return true;
      // A receipt is looked up by its number far more often than by its note,
      // and `#38` is how the number is written everywhere else on the page.
      return (
        String(receipt.id).includes(query.replace('#', '')) ||
        (receipt.notes?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [receipts, search, view]);

  const hasFilters =
    search.trim() !== '' || view !== ReceiptView.ALL || fromDate !== '' || toDate !== '';

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
    setSearch('');
    setView(ReceiptView.ALL);
    setPage(1);
  }

  function handleView(receipt: ReceiptListItem) {
    setSelectedReceipt(receipt);
    setModalOpen(true);
  }

  /** Exports the rows currently in view — what the toolbar says is on screen. */
  function handleExport() {
    if (visibleReceipts.length === 0) {
      toast.error(r.export.empty);
      return;
    }
    downloadCsv(
      dateStampedName('receipts'),
      [r.table.receiptNo, r.table.date, r.table.items, r.table.notes],
      visibleReceipts.map((receipt) => [
        receipt.id,
        receipt.created_at,
        receipt.total_items,
        receipt.notes ?? '',
      ])
    );
    toast.success(r.export.done.replace('{n}', String(visibleReceipts.length)));
  }

  const lastReceiptLabel = stats.lastReceiptAt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(stats.lastReceiptAt))
    : '—';

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
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{r.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700 truncate">
            {r.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{r.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg border border-border bg-paper text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{r.export.btn}</span>
          </button>
          <button
            onClick={() => router.push('/client/sell')}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <ReceiptText size={16} />
            <span className="hidden sm:inline">{r.newBtn}</span>
          </button>
        </div>
      </div>

      <div className="mb-5">
        <StatCardGrid>
          <StatCard label={r.stats.total} value={String(stats.total)} isLoading={isLoadingStats} />
          <StatCard
            label={r.stats.thisWeek}
            value={String(stats.thisWeek)}
            tone={stats.thisWeek > 0 ? 'amber' : 'neutral'}
            isLoading={isLoadingStats}
            onClick={() => setView(ReceiptView.THIS_WEEK)}
          />
          <StatCard
            label={r.stats.itemsConsumed}
            value={String(stats.itemsConsumed)}
            isLoading={isLoadingStats}
          />
          <StatCard
            label={r.stats.lastReceipt}
            value={lastReceiptLabel}
            variant="text"
            isLoading={isLoadingStats}
          />
        </StatCardGrid>
      </div>

      <ReceiptsTableCard
        receipts={visibleReceipts}
        total={total}
        search={search}
        view={view}
        fromDate={fromDate}
        toDate={toDate}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onViewChange={setView}
        onFromDateChange={handleFromDateChange}
        onToDateChange={handleToDateChange}
        onClearFilters={handleClearFilters}
        onView={handleView}
        locale={locale}
        labels={{
          searchPlaceholder: r.searchPlaceholder,
          views: r.views,
          groups: r.groups,
          footer: r.footer,
          filter: r.filter,
          table: {
            ...r.table,
            freeBadge: r.modal.freeBadge,
            cancelledBadge: r.modal.cancelledBadge,
          },
          empty: r.empty,
          emptyFiltered: r.emptyFiltered,
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
        labels={{ ...r.modal, debt: { ...t.debts.receipt, status: t.debts.status } }}
      />
    </div>
  );
}
