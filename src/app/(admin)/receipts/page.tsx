'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, DatePickerButton } from '@/common/components';
import { usePermission } from '@/common/hooks/usePermission';
import { useI18n } from '@/providers/I18nProvider';
import { useReceipts, ReceiptDetailModal } from '@/features/shared/receipts';
import { useShops, ShopType } from '@/features/admin/shops';
import type { Shop } from '@/features/admin/shops';
import { AdminReceiptsTable } from '@/features/admin/receipts/components/AdminReceiptsTable';
import type { ReceiptListItem } from '@/features/shared/receipts';

const LIMIT = 15;

export default function ReceiptsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const r = t.receipts;
  const { isEmployee } = usePermission();

  const [page, setPage] = useState(1);
  const [shopId, setShopId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptListItem | null>(null);

  useEffect(() => {
    if (isEmployee) router.replace('/dashboard');
  }, [isEmployee, router]);

  const { shops: shopsData } = useShops({ type: ShopType.SHOP, limit: 999 });
  const shopList: Shop[] = shopsData?.data ?? [];

  const hasActiveFilter = !!(shopId || fromDate || toDate);

  const params = {
    page,
    limit: LIMIT,
    ...(shopId ? { shopId: Number(shopId) } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const { receipts, total, isLoading, error } = useReceipts(params);

  function resetPage() {
    setPage(1);
  }

  function clearFilters() {
    setShopId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  if (isEmployee) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{r.page.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{r.page.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex gap-3">
          <select
            value={shopId}
            onChange={(e) => {
              setShopId(e.target.value);
              resetPage();
            }}
            className="input flex-1"
          >
            <option value="">{r.filter.allShops}</option>
            {shopList.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DatePickerButton
            value={fromDate}
            onChange={(v) => {
              setFromDate(v);
              resetPage();
            }}
            placeholder={r.filter.fromDate}
            locale={locale}
          />
          <span className="text-gray-300 text-sm">—</span>
          <DatePickerButton
            value={toDate}
            onChange={(v) => {
              setToDate(v);
              resetPage();
            }}
            placeholder={r.filter.toDate}
            locale={locale}
          />

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-sm text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2"
            >
              {r.filter.clear}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{r.page.loadError}</div>
      )}

      <AdminReceiptsTable
        data={receipts}
        isLoading={isLoading}
        onView={setSelectedReceipt}
        labels={{ table: r.table, empty: r.empty }}
      />

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      <ReceiptDetailModal
        receiptId={selectedReceipt?.id ?? null}
        createdByName={selectedReceipt?.created_by_name}
        open={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        locale={locale}
        labels={r.modal}
      />
    </div>
  );
}
