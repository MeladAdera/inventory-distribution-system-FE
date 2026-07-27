'use client';

import { Users, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import type { Customer } from '../types/customers.types';

interface CustomersTableCardProps {
  customers: Customer[];
  search: string;
  hasDebt: boolean;
  includeInactive: boolean;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onHasDebtChange: (value: boolean) => void;
  onIncludeInactiveChange: (value: boolean) => void;
  onClearFilters: () => void;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  /** Omitted for EMPLOYEE — only a SHOP_OWNER may deactivate. */
  onDeactivate?: (customer: Customer) => void;
  onAdd: () => void;
  currency: string;
  labels: {
    searchPlaceholder: string;
    filters: { hasDebt: string; includeInactive: string; clear: string };
    table: {
      name: string;
      phone: string;
      openDebts: string;
      remaining: string;
      actions: string;
      noPhone: string;
      settled: string;
    };
    badge: { inactive: string };
    empty: { title: string; sub: string; cta: string };
    emptyFiltered: { title: string; sub: string };
  };
}

/** Amber when money is owed, muted when settled — the one number that matters per row. */
function OwedAmount({
  amount,
  currency,
  settledLabel,
}: {
  amount: string;
  currency: string;
  settledLabel: string;
}) {
  if (!isPositiveMoney(amount)) {
    return <span className="text-[13px] text-ink-400">{settledLabel}</span>;
  }
  return (
    <span className="font-mono text-[13px] font-bold text-amber-700 tabular-nums">
      {formatMoney(amount)} <span className="font-sans font-normal text-ink-400">{currency}</span>
    </span>
  );
}

export function CustomersTableCard({
  customers,
  search,
  hasDebt,
  includeInactive,
  hasFilters,
  onSearchChange,
  onHasDebtChange,
  onIncludeInactiveChange,
  onClearFilters,
  onView,
  onEdit,
  onDeactivate,
  onAdd,
  currency,
  labels,
}: CustomersTableCardProps) {
  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        <div className="relative flex-1 min-w-50">
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

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasDebt}
            onChange={(e) => onHasDebtChange(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-amber-600"
          />
          <span className="text-[13px] text-ink-700">{labels.filters.hasDebt}</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => onIncludeInactiveChange(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-amber-600"
          />
          <span className="text-[13px] text-ink-700">{labels.filters.includeInactive}</span>
        </label>

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

      {customers.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <Users size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty.title}
          </p>
          <p className="text-[13px] text-ink-500 max-w-70">
            {hasFilters ? labels.emptyFiltered.sub : labels.empty.sub}
          </p>
          {!hasFilters && (
            <button
              onClick={onAdd}
              className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors"
            >
              {labels.empty.cta}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              {[labels.table.name, labels.table.phone, labels.table.openDebts].map((h) => (
                <span
                  key={h}
                  className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                >
                  {h}
                </span>
              ))}
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 text-end">
                {labels.table.remaining}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20 text-center">
                {labels.table.actions}
              </span>
            </div>

            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => onView(c)}
                className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr_auto] items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-medium text-ink-900 truncate">{c.name}</span>
                  {!c.is_active && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-200 text-ink-500">
                      {labels.badge.inactive}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[13px] text-ink-600 truncate">
                  {c.phone || (
                    <span className="font-sans text-ink-400">{labels.table.noPhone}</span>
                  )}
                </span>
                <span className="text-[13px] text-ink-600 tabular-nums">{c.open_debts_count}</span>
                <span className="text-end">
                  <OwedAmount
                    amount={c.total_remaining}
                    currency={currency}
                    settledLabel={labels.table.settled}
                  />
                </span>
                <div
                  className="w-20 flex justify-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onEdit(c)}
                    aria-label={`${labels.table.actions} — ${c.name}`}
                    className="p-2 rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-800 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  {onDeactivate && c.is_active && (
                    <button
                      onClick={() => onDeactivate(c)}
                      aria-label={`${labels.badge.inactive} — ${c.name}`}
                      className="p-2 rounded-lg text-ink-500 hover:bg-danger-100 hover:text-danger-700 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {customers.map((c) => (
              <div key={c.id} onClick={() => onView(c)} className="px-5 py-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[15px] font-semibold text-ink-900 truncate">
                      {c.name}
                    </span>
                    {!c.is_active && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-200 text-ink-500">
                        {labels.badge.inactive}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(c)}
                      aria-label={`${labels.table.actions} — ${c.name}`}
                      className="p-2 rounded-lg text-ink-500 hover:bg-sand-100 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    {onDeactivate && c.is_active && (
                      <button
                        onClick={() => onDeactivate(c)}
                        aria-label={`${labels.badge.inactive} — ${c.name}`}
                        className="p-2 rounded-lg text-ink-500 hover:bg-danger-100 hover:text-danger-700 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-ink-500">
                  <span className="font-mono">{c.phone || labels.table.noPhone}</span>
                  <span className="mx-2 text-ink-300">·</span>
                  {c.open_debts_count} {labels.table.openDebts.toLowerCase()}
                </p>
                <OwedAmount
                  amount={c.total_remaining}
                  currency={currency}
                  settledLabel={labels.table.settled}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
