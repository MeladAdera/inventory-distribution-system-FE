'use client';

import { useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Wallet, HandCoins, FileText, AlertCircle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { usePermission } from '@/common/hooks/usePermission';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import { KpiCard } from '@/features/admin/dashboard/components/KpiCard';
import { CardShell } from '@/features/admin/dashboard/components/CardShell';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useDebts,
  useOwedOrderDebts,
  useReceivables,
  useReceivablesAging,
  useShopDebtSummary,
  DebtsTableCard,
  DebtDetailModal,
  DebtAgingChart,
  OwedToWarehouseCard,
  AgingBucket,
  DebtStatus,
  DebtorType,
} from '@/features/shared/debts';
import type { DebtListItem } from '@/features/shared/debts';
import { OwedToSuppliersCard } from '@/features/shared/suppliers';
import { ROUTES } from '@/common/constants/app.constants';
import { OrderLookupModal } from './orders/OrderLookupModal';

const LIMIT = 15;

export function ClientDebtsPage() {
  const { t, locale } = useI18n();
  const l = t.debts.ledger;
  const rc = t.debts.receivables;
  // Only a SHOP_OWNER reaches this page, and only they may reverse a payment
  // on their own customers' debts.
  const { isShopOwner } = usePermission();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DebtStatus | ''>('');
  const [agingBucket, setAgingBucket] = useState<AgingBucket | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<DebtListItem | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      // This table is the customer side of the ledger, matching the KPI cards
      // and aging chart above it. Without the scope the shop's own warehouse
      // debts land here too, listed under the shop's own name.
      debtorType: DebtorType.CUSTOMER,
      ...(status ? { status } : {}),
      ...(agingBucket ? { agingBucket } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [page, status, agingBucket, fromDate, toDate]
  );

  const { debts, total, totalPages, isLoading, error } = useDebts(params);

  // The dashboard describes what customers owe this shop, so it is scoped to
  // CUSTOMER debts — the shop's own debt to the warehouse is the separate
  // read-only card below, and the two are never netted together.
  const receivablesParams = useMemo(() => ({ debtorType: DebtorType.CUSTOMER }), []);
  const { summary, isLoading: isLoadingSummary } = useReceivables(receivablesParams);
  const {
    rows: agingRows,
    isLoading: isLoadingAging,
    isFetching: isFetchingAging,
  } = useReceivablesAging(receivablesParams);

  const shopId = useAuthStore((s) => s.user?.shopId);
  const { owedByShop, owedToSuppliers } = useShopDebtSummary(shopId);

  // The orders behind that balance. A shop that owes nothing has nothing to
  // break down, so the request never fires.
  const owesWarehouse = isPositiveMoney(owedByShop.total_remaining);
  const {
    orderDebts,
    unsettled: unsettledOrderDebts,
    isLoading: isLoadingOrderDebts,
  } = useOwedOrderDebts(owesWarehouse);

  const hasFilters = Boolean(status || agingBucket || fromDate || toDate);

  // Any filter change invalidates the current page number.
  function withReset<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setStatus('');
    setAgingBucket('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  // Clicking a bar filters the list to exactly the debts behind it; clicking the
  // active one again clears the filter.
  function handleSelectBucket(bucket: AgingBucket) {
    setAgingBucket((current) => (current === bucket ? '' : bucket));
    setPage(1);
  }

  if (isLoading && debts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{l.loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      <div className="mb-5.5">
        <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700">
          {l.header.eyebrow}
        </p>
        <h1 className="text-[26px] font-semibold text-ink-900">{l.header.title}</h1>
        <p className="text-[14px] text-ink-500 mt-1">
          {total > 0 ? l.count.replace('{n}', String(total)) : l.header.subtitle}
        </p>
      </div>

      {/* KPI row — what customers owe this shop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard
          icon={Wallet}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label={rc.cards.remaining}
          value={isLoadingSummary ? '—' : formatMoney(summary.total_remaining)}
          sub={rc.cards.remainingSub}
        />
        <KpiCard
          icon={HandCoins}
          iconBg="bg-success-100"
          iconColor="text-success-700"
          label={rc.cards.collected}
          value={isLoadingSummary ? '—' : formatMoney(summary.total_collected)}
          sub={rc.cards.collectedSub}
        />
        <KpiCard
          icon={FileText}
          iconBg="bg-sand-200"
          iconColor="text-ink-600"
          label={rc.cards.openCount}
          value={isLoadingSummary ? '—' : summary.open_count}
          sub={rc.cards.openCountSub}
        />
        {/* Only worth a tile when there is actually something to refund; otherwise
            show total billed, which is always meaningful. */}
        {isPositiveMoney(summary.refund_due) ? (
          <KpiCard
            icon={AlertCircle}
            iconBg="bg-warning-100"
            iconColor="text-warning-700"
            label={rc.cards.refundDue}
            value={formatMoney(summary.refund_due)}
            sub={rc.cards.refundDueSub}
          />
        ) : (
          <KpiCard
            icon={FileText}
            iconBg="bg-sand-200"
            iconColor="text-ink-600"
            label={rc.cards.billed}
            value={isLoadingSummary ? '—' : formatMoney(summary.total_billed)}
            sub={rc.cards.billedSub}
          />
        )}
      </div>

      {/* Aging — click a bar to filter the list below */}
      <div className="mb-4">
        <CardShell title={rc.aging.title} noPadding>
          <p className="px-5 pt-4 text-[13px] text-ink-400">{rc.aging.subtitle}</p>
          <DebtAgingChart
            rows={agingRows}
            isLoading={isLoadingAging}
            isFetching={isFetchingAging}
            activeBucket={agingBucket}
            onSelectBucket={handleSelectBucket}
            localeCode={locale === 'ar' ? 'ar-SA' : 'en-US'}
            labels={{
              amount: rc.aging.amount,
              count: rc.aging.count,
              empty: rc.aging.empty,
              bucketNames: t.debts.bucket,
            }}
          />
        </CardShell>
      </div>

      {/* The two money-out sides of the ledger. Both sit apart from the
          receivables above, and neither is ever netted against it or each
          other — one is owed to the warehouse for orders, the other to the
          shop's own suppliers for deliveries. */}
      <div className="mb-4">
        <OwedToSuppliersCard
          summary={owedToSuppliers}
          href={ROUTES.CLIENT_SUPPLIERS}
          currency={t.debts.currency}
          labels={t.debts.suppliers.owedCard}
        />
      </div>

      <div className="mb-4">
        <OwedToWarehouseCard
          summary={owedByShop}
          orderDebts={orderDebts}
          unsettled={unsettledOrderDebts}
          isLoadingOrders={isLoadingOrderDebts}
          onViewOrder={setViewingOrderId}
          currency={t.debts.currency}
          locale={locale}
          labels={{
            ...rc.owedByShop,
            orderLabel: l.table.fromOrder,
            statusNames: t.debts.status,
          }}
        />
      </div>

      <DebtsTableCard
        debts={debts}
        status={status}
        agingBucket={agingBucket}
        fromDate={fromDate}
        toDate={toDate}
        hasFilters={hasFilters}
        onStatusChange={withReset(setStatus)}
        onAgingBucketChange={withReset(setAgingBucket)}
        onFromDateChange={withReset(setFromDate)}
        onToDateChange={withReset(setToDate)}
        onClearFilters={clearFilters}
        onView={setSelected}
        locale={locale}
        labels={{
          filters: l.filters,
          table: l.table,
          empty: l.empty,
          emptyFiltered: l.emptyFiltered,
          statusNames: t.debts.status,
          bucketNames: t.debts.bucket,
        }}
      />

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

      <DebtDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        debt={selected}
        canReverse={isShopOwner}
        locale={locale}
        currency={t.debts.currency}
        labels={{
          ...t.debts.detail,
          statusNames: t.debts.status,
          methodNames: t.debts.method,
          reverse: t.debts.reverse,
        }}
      />

      {/* Opened from a row of the warehouse breakdown — what the debt was for */}
      <OrderLookupModal orderId={viewingOrderId} onClose={() => setViewingOrderId(null)} />
    </div>
  );
}
