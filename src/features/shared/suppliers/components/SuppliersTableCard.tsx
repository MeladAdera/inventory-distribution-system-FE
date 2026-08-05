'use client';

import { useEffect, useRef, useState } from 'react';
import { Truck, Pencil, Trash2, Search, X, Phone, ArrowDownWideNarrow, Check } from 'lucide-react';
import { FilterChips } from '@/common/components';
import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped, isPositiveMoney } from '@/common/utils/money';
import { SupplierSort, SupplierView } from '../types/suppliers.types';
import type { Supplier } from '../types/suppliers.types';
import { SupplierAvatar } from './SupplierAvatar';

export interface SuppliersTableLabels {
  searchPlaceholder: string;
  views: Record<'all' | 'hasDebt' | 'removed', string>;
  sort: {
    label: string;
    sortedBy: string;
    pageOnly: string;
    debtDesc: string;
    newest: string;
    name: string;
  };
  since: string;
  callBtn: string;
  footer: string;
  clearFilters: string;
  table: {
    name: string;
    phone: string;
    openBills: string;
    remaining: string;
    actions: string;
    noPhone: string;
    settled: string;
  };
  badge: { inactive: string };
  empty: { title: string; sub: string; cta: string };
  emptyFiltered: { title: string; sub: string };
}

interface SuppliersTableCardProps {
  rows: Supplier[];
  /** Total matching the active filters, across all pages — for the footer. */
  total: number;
  search: string;
  view: SupplierView;
  sort: SupplierSort;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onViewChange: (view: SupplierView) => void;
  onSortChange: (sort: SupplierSort) => void;
  onClearFilters: () => void;
  onEdit: (supplier: Supplier) => void;
  onDeactivate: (supplier: Supplier) => void;
  onAdd: () => void;
  currency: string;
  labels: SuppliersTableLabels;
}

const VIEW_ORDER: { value: SupplierView; key: 'all' | 'hasDebt' | 'removed' }[] = [
  { value: SupplierView.ALL, key: 'all' },
  { value: SupplierView.HAS_DEBT, key: 'hasDebt' },
  { value: SupplierView.REMOVED, key: 'removed' },
];

const SORT_ORDER: { value: SupplierSort; key: 'debtDesc' | 'newest' | 'name' }[] = [
  { value: SupplierSort.DEBT_DESC, key: 'debtDesc' },
  { value: SupplierSort.NEWEST, key: 'newest' },
  { value: SupplierSort.NAME, key: 'name' },
];

/** The year this supplier was added — context for how established the account is. */
function joinedYear(iso: string): string {
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? String(year) : '';
}

/**
 * What the shop owes this supplier.
 *
 * No age hint alongside it, unlike the customers list: payables carry no
 * page-wide ledger to resolve each supplier's oldest bill from — see
 * `useSupplierRows`.
 */
function OwedCell({
  supplier,
  currency,
  labels,
  align,
}: {
  supplier: Supplier;
  currency: string;
  labels: SuppliersTableLabels;
  align: 'start' | 'end';
}) {
  if (!isPositiveMoney(supplier.total_remaining)) {
    return (
      <span className={cn('block text-[13px] text-ink-400', align === 'end' && 'text-end')}>
        {labels.table.settled}
      </span>
    );
  }

  return (
    <span className={cn('block', align === 'end' && 'text-end')}>
      <span className="font-mono text-[14px] font-bold tabular-nums text-danger-700">
        {formatMoneyGrouped(supplier.total_remaining)}{' '}
        <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
      </span>
    </span>
  );
}

function SortMenu({
  sort,
  onChange,
  labels,
}: {
  sort: SupplierSort;
  onChange: (s: SupplierSort) => void;
  labels: SuppliersTableLabels;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on any click that lands outside, and on Escape — a menu that only
  // closes by re-clicking its own button gets stranded behind the next tap.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeKey = SORT_ORDER.find((o) => o.value === sort)?.key ?? 'debtDesc';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-paper text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
      >
        <ArrowDownWideNarrow size={15} className="text-ink-400 shrink-0" />
        <span className="whitespace-nowrap">{labels.sort[activeKey]}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-e-0 top-full mt-1.5 z-20 w-56 py-1 bg-paper border border-border rounded-lg shadow-md"
        >
          {SORT_ORDER.map((option) => (
            <button
              key={option.value}
              role="menuitemradio"
              aria-checked={sort === option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer text-start"
            >
              <Check
                size={14}
                className={cn('shrink-0', sort === option.value ? 'text-amber-600' : 'opacity-0')}
              />
              {labels.sort[option.key]}
            </button>
          ))}
          <p className="px-3 pt-1.5 pb-1 text-[11px] text-ink-400 border-t border-border mt-1">
            {labels.sort.pageOnly}
          </p>
        </div>
      )}
    </div>
  );
}

export function SuppliersTableCard({
  rows,
  total,
  search,
  view,
  sort,
  hasFilters,
  onSearchChange,
  onViewChange,
  onSortChange,
  onClearFilters,
  onEdit,
  onDeactivate,
  onAdd,
  currency,
  labels,
}: SuppliersTableCardProps) {
  const sortName = labels.sort[SORT_ORDER.find((o) => o.value === sort)?.key ?? 'debtDesc'];

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border">
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
          <FilterChips
            value={view}
            onChange={onViewChange}
            options={VIEW_ORDER.map((o) => ({ value: o.value, label: labels.views[o.key] }))}
            className="shrink-0"
          />
        </div>

        {/* Sorting only reorders what's on screen, so it stays out of the way on
            a phone where the whole page is one column anyway. */}
        <div className="hidden sm:block order-2 sm:order-3">
          <SortMenu sort={sort} onChange={onSortChange} labels={labels} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <Truck size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty.title}
          </p>
          <p className="text-[13px] text-ink-500 max-w-70">
            {hasFilters ? labels.emptyFiltered.sub : labels.empty.sub}
          </p>
          {hasFilters ? (
            <button
              onClick={onClearFilters}
              className="mt-1 flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              <X size={14} />
              {labels.clearFilters}
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
            >
              {labels.empty.cta}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1.8fr_1.1fr_0.9fr_1.1fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              {[labels.table.name, labels.table.phone, labels.table.openBills].map((h) => (
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

            {rows.map((s) => (
              <div
                key={s.id}
                onClick={() => onEdit(s)}
                className="grid grid-cols-[1.8fr_1.1fr_0.9fr_1.1fr_auto] items-center gap-4 px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-page transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <SupplierAvatar name={s.name} muted={!s.is_active} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-medium text-ink-900 truncate">
                        {s.name}
                      </span>
                      {!s.is_active && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-200 text-ink-500">
                          {labels.badge.inactive}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-ink-400 truncate">
                      {labels.since.replace('{year}', joinedYear(s.created_at))}
                    </span>
                  </span>
                </span>

                {/* `<bdi>` and not dir="ltr" on the cell: a leading `+` has to
                    render on the left of the digits, but `dir` also flips the
                    cell's text-align, which in Arabic parks the number at the
                    far edge of the column, away from its own header. */}
                <span className="font-mono text-[13px] text-ink-600 truncate">
                  {s.phone ? (
                    <bdi>{s.phone}</bdi>
                  ) : (
                    <span className="font-sans text-ink-400">{labels.table.noPhone}</span>
                  )}
                </span>

                <span className="text-[13px] text-ink-600 tabular-nums">
                  {s.open_debts_count || <span className="text-ink-300">—</span>}
                </span>

                <OwedCell supplier={s} currency={currency} labels={labels} align="end" />

                <div
                  className="w-20 flex justify-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onEdit(s)}
                    aria-label={`${labels.table.actions} — ${s.name}`}
                    className="p-2 rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-800 transition-colors cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>
                  {s.is_active && (
                    <button
                      onClick={() => onDeactivate(s)}
                      aria-label={`${labels.badge.inactive} — ${s.name}`}
                      className="p-2 rounded-lg text-ink-500 hover:bg-danger-100 hover:text-danger-700 transition-colors cursor-pointer"
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
            {rows.map((s) => (
              <div key={s.id} onClick={() => onEdit(s)} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <SupplierAvatar name={s.name} muted={!s.is_active} size="sm" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-semibold text-ink-900 truncate">
                          {s.name}
                        </span>
                        {!s.is_active && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sand-200 text-ink-500">
                            {labels.badge.inactive}
                          </span>
                        )}
                      </span>
                      <span className="block font-mono text-[12px] text-ink-500 truncate">
                        {s.phone ? (
                          <bdi>{s.phone}</bdi>
                        ) : (
                          <span className="font-sans">{labels.table.noPhone}</span>
                        )}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0">
                    <OwedCell supplier={s} currency={currency} labels={labels} align="end" />
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 mt-3 pt-3 border-t border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex-1 min-w-0 text-[12px] text-ink-500 truncate">
                    {/* Mid-sentence on a card, unlike the desktop column header.
                        Arabic is unaffected — it has no case. */}
                    {s.open_debts_count} {labels.table.openBills.toLowerCase()}
                  </span>

                  {s.phone && (
                    <a
                      href={`tel:${s.phone}`}
                      aria-label={`${labels.callBtn} — ${s.name}`}
                      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-[13px] font-medium text-ink-700 active:bg-sand-100 transition-colors shrink-0"
                    >
                      <Phone size={14} />
                      {labels.callBtn}
                    </a>
                  )}

                  <button
                    onClick={() => onEdit(s)}
                    aria-label={`${labels.table.actions} — ${s.name}`}
                    className="p-2 rounded-lg text-ink-500 active:bg-sand-100 transition-colors shrink-0"
                  >
                    <Pencil size={16} />
                  </button>
                  {s.is_active && (
                    <button
                      onClick={() => onDeactivate(s)}
                      aria-label={`${labels.badge.inactive} — ${s.name}`}
                      className="p-2 rounded-lg text-ink-500 active:bg-danger-100 active:text-danger-700 transition-colors shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: what's on screen, and how it's ordered. */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border bg-page">
            <p className="text-[12px] text-ink-400">
              {labels.footer
                .replace('{shown}', String(rows.length))
                .replace('{total}', String(total))}
            </p>
            <p className="hidden sm:block text-[12px] text-ink-400">
              {labels.sort.sortedBy.replace('{name}', sortName)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
