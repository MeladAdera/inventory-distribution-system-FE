'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Users,
  Pencil,
  Trash2,
  Search,
  X,
  Phone,
  Banknote,
  ArrowDownWideNarrow,
  Check,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped, isPositiveMoney } from '@/common/utils/money';
import { CustomerSort, CustomerView } from '../types/customers.types';
import type { CustomerRow } from '../types/customers.types';
import { CustomerAvatar } from './CustomerAvatar';

/**
 * Past this many days a balance stops being "recent" and starts being chased.
 * Same boundary the ledger's aging buckets use (0–30 / 31–60 / 60+), so the two
 * screens never disagree about who is overdue.
 */
const OVERDUE_AFTER_DAYS = 30;

export interface CustomersTableLabels {
  searchPlaceholder: string;
  views: Record<'all' | 'hasDebt' | 'removed', string>;
  sort: {
    label: string;
    sortedBy: string;
    pageOnly: string;
    debtDesc: string;
    oldestDebt: string;
    newest: string;
    name: string;
  };
  since: string;
  due: { soon: string; one: string; two: string; few: string; many: string };
  callBtn: string;
  collectBtn: string;
  footer: string;
  clearFilters: string;
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
}

interface CustomersTableCardProps {
  rows: CustomerRow[];
  /** Total matching the active filters, across all pages — for the footer. */
  total: number;
  search: string;
  view: CustomerView;
  sort: CustomerSort;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onViewChange: (view: CustomerView) => void;
  onSortChange: (sort: CustomerSort) => void;
  onClearFilters: () => void;
  onView: (customer: CustomerRow) => void;
  onEdit: (customer: CustomerRow) => void;
  /** Omitted for EMPLOYEE — only a SHOP_OWNER may deactivate. */
  onDeactivate?: (customer: CustomerRow) => void;
  onCollect: (customer: CustomerRow) => void;
  onAdd: () => void;
  currency: string;
  labels: CustomersTableLabels;
}

const VIEW_ORDER: { value: CustomerView; key: 'all' | 'hasDebt' | 'removed' }[] = [
  { value: CustomerView.ALL, key: 'all' },
  { value: CustomerView.HAS_DEBT, key: 'hasDebt' },
  { value: CustomerView.REMOVED, key: 'removed' },
];

const SORT_ORDER: { value: CustomerSort; key: 'debtDesc' | 'oldestDebt' | 'newest' | 'name' }[] = [
  { value: CustomerSort.DEBT_DESC, key: 'debtDesc' },
  { value: CustomerSort.OLDEST_DEBT, key: 'oldestDebt' },
  { value: CustomerSort.NEWEST, key: 'newest' },
  { value: CustomerSort.NAME, key: 'name' },
];

/**
 * Arabic needs four forms for a day count (1 / 2 / 3–10 / 11+), and picking one
 * by `n === 1` alone produces "متأخر 9 يوم". English collapses them, so both
 * languages can share this without a plural-rules library.
 */
function pluralForm(n: number): 'one' | 'two' | 'few' | 'many' {
  if (n === 1) return 'one';
  if (n === 2) return 'two';
  const mod = n % 100;
  return mod >= 3 && mod <= 10 ? 'few' : 'many';
}

/** The year a customer was added — context for how much slack to give them. */
function joinedYear(iso: string): string {
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? String(year) : '';
}

/**
 * What is owed, and how long it has been owed for.
 *
 * The age is what makes the number actionable, so the two are always rendered
 * together: red once past the overdue boundary, muted while a balance is still
 * young, and nothing at all once the customer is settled up.
 */
function OwedCell({
  customer,
  currency,
  labels,
  align,
}: {
  customer: CustomerRow;
  currency: string;
  labels: CustomersTableLabels;
  align: 'start' | 'end';
}) {
  const owes = isPositiveMoney(customer.total_remaining);
  const age = customer.oldest_debt_age_days;
  const overdue = owes && age !== null && age > OVERDUE_AFTER_DAYS;

  if (!owes) {
    return (
      <span className={cn('block text-[13px] text-ink-400', align === 'end' && 'text-end')}>
        {labels.table.settled}
      </span>
    );
  }

  // A null age means the ledger hasn't answered yet — either still loading, or
  // this customer's debt fell outside the fetched window. Saying "due soon" on
  // a guess would understate a balance that is actually months old, so an
  // unknown age simply shows no hint.
  const hint =
    age === null
      ? null
      : age === 0
        ? labels.due.soon
        : labels.due[pluralForm(age)].replace('{n}', String(age));

  return (
    <span className={cn('block', align === 'end' && 'text-end')}>
      <span
        className={cn(
          'font-mono text-[14px] font-bold tabular-nums',
          overdue ? 'text-danger-700' : 'text-amber-700'
        )}
      >
        {formatMoneyGrouped(customer.total_remaining)}{' '}
        <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
      </span>
      {hint && (
        <span className={cn('block text-[11px]', overdue ? 'text-danger-700' : 'text-ink-400')}>
          {hint}
        </span>
      )}
    </span>
  );
}

/** Segmented view switcher — one slice of the list at a time. */
function ViewChips({
  view,
  onChange,
  labels,
}: {
  view: CustomerView;
  onChange: (v: CustomerView) => void;
  labels: CustomersTableLabels;
}) {
  return (
    <div className="flex gap-1 p-1 bg-page border border-border rounded-lg shrink-0">
      {VIEW_ORDER.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={view === option.value}
          className={cn(
            'h-7 px-3 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors',
            view === option.value
              ? 'bg-amber-600 text-white'
              : 'text-ink-600 hover:bg-sand-100 cursor-pointer'
          )}
        >
          {labels.views[option.key]}
        </button>
      ))}
    </div>
  );
}

function SortMenu({
  sort,
  onChange,
  labels,
}: {
  sort: CustomerSort;
  onChange: (s: CustomerSort) => void;
  labels: CustomersTableLabels;
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

export function CustomersTableCard({
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
  onView,
  onEdit,
  onDeactivate,
  onCollect,
  onAdd,
  currency,
  labels,
}: CustomersTableCardProps) {
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
          <ViewChips view={view} onChange={onViewChange} labels={labels} />
        </div>

        {/* Sorting only reorders what's on screen, so it stays out of the way
            on a phone where the whole page is one column anyway. */}
        <div className="hidden sm:block order-2 sm:order-3">
          <SortMenu sort={sort} onChange={onSortChange} labels={labels} />
        </div>
      </div>

      {rows.length === 0 ? (
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
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-28 text-center">
                {labels.table.actions}
              </span>
            </div>

            {rows.map((c) => {
              const owes = isPositiveMoney(c.total_remaining);
              return (
                <div
                  key={c.id}
                  onClick={() => onView(c)}
                  className="grid grid-cols-[1.8fr_1.1fr_0.9fr_1.1fr_auto] items-center gap-4 px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-page transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <CustomerAvatar name={c.name} muted={!c.is_active} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[14px] font-medium text-ink-900 truncate">
                          {c.name}
                        </span>
                        {!c.is_active && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-medium bg-sand-200 text-ink-500">
                            {labels.badge.inactive}
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-ink-400 truncate">
                        {labels.since.replace('{year}', joinedYear(c.created_at))}
                      </span>
                    </span>
                  </span>

                  {/* `<bdi>` and not dir="ltr" on the cell: a leading `+` has to
                      render on the left of the digits, but `dir` also flips the
                      cell's text-align, which in Arabic parks the number at the
                      far edge of the column, away from its own header. */}
                  <span className="font-mono text-[13px] text-ink-600 truncate">
                    {c.phone ? (
                      <bdi>{c.phone}</bdi>
                    ) : (
                      <span className="font-sans text-ink-400">{labels.table.noPhone}</span>
                    )}
                  </span>

                  <span className="text-[13px] text-ink-600 tabular-nums">
                    {c.open_debts_count || <span className="text-ink-300">—</span>}
                  </span>

                  <OwedCell customer={c} currency={currency} labels={labels} align="end" />

                  <div
                    className="w-28 flex justify-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onCollect(c)}
                      disabled={!owes}
                      aria-label={`${labels.collectBtn} — ${c.name}`}
                      title={labels.collectBtn}
                      className="p-2 rounded-lg text-ink-500 hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-500"
                    >
                      <Banknote size={15} />
                    </button>
                    <button
                      onClick={() => onEdit(c)}
                      aria-label={`${labels.table.actions} — ${c.name}`}
                      className="p-2 rounded-lg text-ink-500 hover:bg-sand-100 hover:text-ink-800 transition-colors cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>
                    {onDeactivate && c.is_active && (
                      <button
                        onClick={() => onDeactivate(c)}
                        aria-label={`${labels.badge.inactive} — ${c.name}`}
                        className="p-2 rounded-lg text-ink-500 hover:bg-danger-100 hover:text-danger-700 transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {rows.map((c) => {
              const owes = isPositiveMoney(c.total_remaining);
              return (
                <div key={c.id} onClick={() => onView(c)} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <CustomerAvatar name={c.name} muted={!c.is_active} size="sm" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-[14px] font-semibold text-ink-900 truncate">
                            {c.name}
                          </span>
                          {!c.is_active && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sand-200 text-ink-500">
                              {labels.badge.inactive}
                            </span>
                          )}
                        </span>
                        <span className="block font-mono text-[12px] text-ink-500 truncate">
                          {c.phone ? (
                            <bdi>{c.phone}</bdi>
                          ) : (
                            <span className="font-sans">{labels.table.noPhone}</span>
                          )}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0">
                      <OwedCell customer={c} currency={currency} labels={labels} align="end" />
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2 mt-3 pt-3 border-t border-border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="flex-1 min-w-0 text-[12px] text-ink-500 truncate">
                      {/* Mid-sentence on a card, unlike the desktop column
                          header. Arabic is unaffected — it has no case. */}
                      {c.open_debts_count} {labels.table.openDebts.toLowerCase()}
                    </span>

                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        aria-label={`${labels.callBtn} — ${c.name}`}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-[13px] font-medium text-ink-700 active:bg-sand-100 transition-colors shrink-0"
                      >
                        <Phone size={14} />
                        {labels.callBtn}
                      </a>
                    )}

                    {/* One primary action per row: chase the money when there is
                        money to chase, otherwise offer the housekeeping that is
                        only possible on a settled customer. */}
                    {owes ? (
                      <button
                        onClick={() => onCollect(c)}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-amber-100 text-[13px] font-semibold text-amber-700 active:bg-amber-500/30 transition-colors shrink-0"
                      >
                        <Banknote size={14} />
                        {labels.collectBtn}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(c)}
                          aria-label={`${labels.table.actions} — ${c.name}`}
                          className="p-2 rounded-lg text-ink-500 active:bg-sand-100 transition-colors shrink-0"
                        >
                          <Pencil size={16} />
                        </button>
                        {onDeactivate && c.is_active && (
                          <button
                            onClick={() => onDeactivate(c)}
                            aria-label={`${labels.badge.inactive} — ${c.name}`}
                            className="p-2 rounded-lg text-ink-500 active:bg-danger-100 active:text-danger-700 transition-colors shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
