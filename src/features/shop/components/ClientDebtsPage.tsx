'use client';

import { useMemo, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { usePermission } from '@/common/hooks/usePermission';
import {
  useDebts,
  DebtsTableCard,
  DebtDetailModal,
  AgingBucket,
  DebtStatus,
} from '@/features/shared/debts';
import type { DebtListItem } from '@/features/shared/debts';

const LIMIT = 15;

export function ClientDebtsPage() {
  const { t, locale } = useI18n();
  const l = t.debts.ledger;
  // Only a SHOP_OWNER reaches this page, and only they may reverse a payment
  // on their own customers' debts.
  const { isShopOwner } = usePermission();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DebtStatus | ''>('');
  const [agingBucket, setAgingBucket] = useState<AgingBucket | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<DebtListItem | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(status ? { status } : {}),
      ...(agingBucket ? { agingBucket } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [page, status, agingBucket, fromDate, toDate]
  );

  const { debts, total, totalPages, isLoading, error } = useDebts(params);

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
    </div>
  );
}
