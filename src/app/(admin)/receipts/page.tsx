'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { Pagination, StatCard, StatCardGrid } from '@/common/components';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { isThisWeek } from '@/common/utils/date.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import {
  useReceipts,
  useReceiptStats,
  ReceiptDetailModal,
  ReceiptView,
} from '@/features/shared/receipts';
import { useShops, ShopType } from '@/features/admin/shops';
import type { Shop } from '@/features/admin/shops';
import { AdminReceiptsTable } from '@/features/admin/receipts/components/AdminReceiptsTable';
import type { ReceiptListItem } from '@/features/shared/receipts';

const LIMIT = 15;

export default function ReceiptsPage() {
  const { t, locale } = useI18n();
  const r = t.receipts;
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [shopId, setShopId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ReceiptView>(ReceiptView.ALL);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptListItem | null>(null);

  const { shops: shopsData } = useShops({ type: ShopType.SHOP, limit: 999 });
  const shopList: Shop[] = shopsData?.data ?? [];

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(shopId ? { shopId: Number(shopId) } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [page, shopId, fromDate, toDate]
  );

  const { receipts, total, isLoading, error } = useReceipts(params);
  const { stats, isLoading: isLoadingStats } = useReceiptStats();

  /**
   * Shop and date range are what the API understands, so they decide which page
   * is fetched. Search and the view chips narrow that page, and the card footer
   * reports both counts so the difference is never silent.
   */
  const visibleReceipts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (view === ReceiptView.THIS_WEEK && !isThisWeek(receipt.created_at)) return false;
      if (view === ReceiptView.WITH_NOTES && !receipt.notes) return false;
      if (!query) return true;
      // `#38` is how a receipt number is written everywhere else on the page.
      return (
        String(receipt.id).includes(query.replace('#', '')) ||
        receipt.shop_name.toLowerCase().includes(query) ||
        receipt.created_by_name.toLowerCase().includes(query) ||
        (receipt.notes?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [receipts, search, view]);

  const hasFilters =
    search.trim() !== '' ||
    view !== ReceiptView.ALL ||
    shopId !== '' ||
    fromDate !== '' ||
    toDate !== '';

  function changeShop(value: string) {
    setShopId(value);
    setPage(1);
  }

  function changeFromDate(value: string) {
    setFromDate(value);
    setPage(1);
  }

  function changeToDate(value: string) {
    setToDate(value);
    setPage(1);
  }

  function clearFilters() {
    setShopId('');
    setFromDate('');
    setToDate('');
    setSearch('');
    setView(ReceiptView.ALL);
    setPage(1);
  }

  /** Exports the rows currently in view — what the toolbar says is on screen. */
  function handleExport() {
    if (visibleReceipts.length === 0) {
      toast.error(r.export.empty);
      return;
    }
    downloadCsv(
      dateStampedName('receipts'),
      [
        r.table.receiptNo,
        r.table.shop,
        r.table.createdBy,
        r.table.date,
        r.table.items,
        r.table.notes,
      ],
      visibleReceipts.map((receipt) => [
        receipt.id,
        receipt.shop_name,
        receipt.created_by_name,
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

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700 truncate">
            {r.page.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{r.page.title}</h1>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg border border-border bg-paper text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer shrink-0"
        >
          <Download size={16} />
          <span className="hidden sm:inline">{r.export.btn}</span>
        </button>
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
          {/* Shops, not a date, in the fourth slot: an admin reads this page to
              see which shops are moving stock, so the last-receipt date sits
              under the row as a footnote instead. */}
          <StatCard
            label={r.stats.activeShops}
            value={String(stats.activeShops)}
            isLoading={isLoadingStats}
          />
        </StatCardGrid>
        <p className="mt-2 px-1 text-[12px] text-ink-400">
          {r.stats.lastReceipt}: {lastReceiptLabel}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger-100 px-4 py-3 text-[13px] text-danger-700">
          <AlertTriangle size={16} className="shrink-0" />
          {r.page.loadError}
        </div>
      )}

      <AdminReceiptsTable
        receipts={visibleReceipts}
        total={total}
        isLoading={isLoading}
        search={search}
        view={view}
        shopId={shopId}
        shops={shopList}
        fromDate={fromDate}
        toDate={toDate}
        hasFilters={hasFilters}
        onSearchChange={setSearch}
        onViewChange={setView}
        onShopChange={changeShop}
        onFromDateChange={changeFromDate}
        onToDateChange={changeToDate}
        onClearFilters={clearFilters}
        onView={setSelectedReceipt}
        locale={locale}
        labels={{
          searchPlaceholder: r.searchPlaceholder,
          views: r.views,
          footer: r.footer,
          filter: r.filter,
          table: r.table,
          empty: r.empty,
          emptyFiltered: r.emptyFiltered,
          freeBadge: r.modal.freeBadge,
          cancelledBadge: r.modal.cancelledBadge,
        }}
      />

      {total > LIMIT && (
        <div className="mt-4">
          <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      )}

      <ReceiptDetailModal
        receiptId={selectedReceipt?.id ?? null}
        createdByName={selectedReceipt?.created_by_name}
        open={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        locale={locale}
        labels={{ ...r.modal, debt: { ...t.debts.receipt, status: t.debts.status } }}
      />
    </div>
  );
}
