'use client';

import { useState } from 'react';
import { Info, CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoney, isPositiveMoney, parseMoney, sumMoney } from '@/common/utils/money';
import { DebtStatusBadge } from './DebtStatusBadge';
import { DebtStatus } from '../types/debts.types';
import type { DebtListItem, DebtsSummary } from '../types/debts.types';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/** Whole days since the debt was created — the same clock the aging buckets use. */
function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/**
 * `paid` as a share of `paid + outstanding`, 0–100.
 *
 * Normalising over the two parts rather than over a separately-reported total
 * keeps the bar filling exactly once: if the API's billed figure ever drifts
 * from collected + remaining, a bar built on it would over- or underflow.
 */
function paidShare(paid: string, outstanding: string): number {
  const p = parseMoney(paid);
  const o = parseMoney(outstanding);
  if (!Number.isFinite(p) || !Number.isFinite(o)) return 0;
  const whole = p + o;
  if (whole <= 0) return p > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (p / whole) * 100));
}

interface OwedToWarehouseCardProps {
  summary: DebtsSummary;
  /** Unsettled and settled order-debts, newest first. */
  orderDebts: DebtListItem[];
  /** The subset still carrying a balance — what the headline is made of. */
  unsettled: DebtListItem[];
  isLoadingOrders?: boolean;
  onViewOrder: (orderId: number) => void;
  currency: string;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    remaining: string;
    collected: string;
    readOnlyHint: string;
    settled: string;
    outOf: string;
    ordersTitle: string;
    tabUnsettled: string;
    tabAll: string;
    paidOf: string;
    noPaymentsYet: string;
    oldest: string;
    ageDays: string;
    detailsBtn: string;
    footerTotal: string;
    ordersEmpty: string;
    viewOrder: string;
    /** "Order #{id}" — the same label the ledger table uses. */
    orderLabel: string;
    statusNames: Record<DebtStatus, string>;
  };
}

/** A two-tone bar: how much of this balance has been paid off. */
function ProgressBar({ percent, thin }: { percent: number; thin?: boolean }) {
  return (
    <div
      className={cn(
        'flex w-full rounded-full bg-sand-200 overflow-hidden',
        thin ? 'h-1.5' : 'h-2.5'
      )}
    >
      <div className="bg-success-700" style={{ width: `${percent}%` }} />
      <div className="bg-amber-500" style={{ width: `${100 - percent}%` }} />
    </div>
  );
}

function LegendDot({ className }: { className: string }) {
  return <span className={cn('w-2 h-2 rounded-full shrink-0', className)} />;
}

/**
 * What this shop still owes the warehouse, and which orders it came from.
 *
 * Read-only by design — there is no "pay" button anywhere in here. A shop owner
 * cannot record a payment against their own order-debt; only the warehouse admin
 * can, because the admin is the party physically receiving the money. The
 * per-order breakdown exists so the owner can answer "why do I owe this?" on
 * their own, which is the one thing a lump sum could never tell them.
 *
 * Never netted against what customers owe the shop: the two sides answer
 * different questions and the API reports them separately.
 */
export function OwedToWarehouseCard({
  summary,
  orderDebts,
  unsettled,
  isLoadingOrders = false,
  onViewOrder,
  currency,
  locale,
  labels,
}: OwedToWarehouseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const owes = isPositiveMoney(summary.total_remaining);

  if (!owes) {
    return (
      <div className="flex items-center gap-2.5 px-5 py-4 bg-paper border border-border rounded-xl">
        <CheckCircle2 size={17} className="text-success-700 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-ink-800">{labels.title}</p>
          <p className="text-[13px] text-ink-500">{labels.settled}</p>
        </div>
      </div>
    );
  }

  const rows = showAll ? orderDebts : unsettled;
  const paidPercent = paidShare(summary.total_collected, summary.total_remaining);

  // The oldest thing still owed, worth calling out only when there is something
  // to be oldest *than*.
  const oldestId = unsettled.length > 1 ? unsettled[unsettled.length - 1].id : null;

  // Summed from the rows on screen rather than reusing the headline, so the two
  // figures disagreeing stays visible instead of being papered over.
  const shownRemaining = sumMoney(rows.map((d) => d.remaining));

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Headline */}
      <div className="px-5 py-5">
        <p className="text-[13px] font-semibold text-ink-800">{labels.title}</p>

        <p className="font-mono text-[34px] font-bold text-danger-700 tabular-nums leading-tight mt-1">
          {formatMoney(summary.total_remaining)}{' '}
          <span className="font-sans text-[15px] font-normal text-ink-400">{currency}</span>
        </p>

        <p className="text-[13px] text-ink-500 mb-4">
          {labels.outOf
            .replace('{total}', formatMoney(summary.total_billed))
            .replace('{n}', String(summary.open_count))}
        </p>

        <ProgressBar percent={paidPercent} />

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 mt-2.5 text-[12px]">
          <span className="flex items-center gap-1.5 text-ink-500">
            <LegendDot className="bg-success-700" />
            {labels.collected}
            <span className="font-mono font-bold tabular-nums text-success-700">
              {formatMoney(summary.total_collected)}
            </span>
            <span className="text-ink-400">({Math.round(paidPercent)}%)</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink-500">
            <LegendDot className="bg-amber-500" />
            {labels.remaining}
            <span className="font-mono font-bold tabular-nums text-danger-700">
              {formatMoney(summary.total_remaining)}
            </span>
          </span>
        </div>

        <p className="flex items-start gap-1.5 mt-4 px-3 py-2.5 rounded-lg bg-page border border-border text-[12px] text-ink-500">
          <Info size={13} className="mt-0.5 shrink-0" />
          {labels.readOnlyHint}
        </p>
      </div>

      {/* Which orders make it up */}
      <div className="border-t border-border">
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-5 py-3.5',
            expanded && 'border-b border-border'
          )}
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 flex-1 text-start text-[13px] font-semibold text-ink-800"
          >
            <ChevronDown
              size={15}
              className={cn('shrink-0 text-ink-400 transition-transform', expanded && 'rotate-180')}
            />
            {labels.ordersTitle}{' '}
            <span className="font-normal text-ink-400">({unsettled.length})</span>
          </button>
          <div className={cn('items-center gap-1', expanded ? 'flex' : 'hidden')}>
            {(
              [
                [false, labels.tabUnsettled],
                [true, labels.tabAll.replace('{n}', String(orderDebts.length))],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                onClick={() => setShowAll(value)}
                aria-pressed={showAll === value}
                className={cn(
                  'h-8 px-3 rounded-lg text-[12px] font-semibold transition-colors',
                  showAll === value
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-ink-500 hover:bg-sand-100'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!expanded ? null : isLoadingOrders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-ink-400" />
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-ink-500">{labels.ordersEmpty}</p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {rows.map((d) => {
                const orderId = d.order_id;
                const isSettled = !isPositiveMoney(d.remaining);
                const percent = paidShare(d.paid_amount, d.remaining);

                return (
                  <li
                    key={d.id}
                    className={cn('px-5 py-4 flex items-start gap-4', isSettled && 'bg-sand-50')}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <span
                          className={cn(
                            'text-[14px] font-semibold',
                            isSettled ? 'text-ink-500' : 'text-ink-900'
                          )}
                        >
                          {orderId != null
                            ? labels.orderLabel.replace('{id}', String(orderId))
                            : '—'}
                        </span>
                        <span className="text-[12px] text-ink-400">
                          {formatDate(d.created_at, locale)}
                        </span>
                        <DebtStatusBadge
                          status={d.status}
                          label={labels.statusNames[d.status]}
                          small
                        />
                        {d.id === oldestId && (
                          <span className="text-[12px] font-medium text-danger-700">
                            {labels.ageDays.replace('{n}', String(ageInDays(d.created_at)))} ·{' '}
                            {labels.oldest}
                          </span>
                        )}
                      </div>

                      {!isSettled && (
                        <div className="mt-2.5 max-w-100">
                          <ProgressBar percent={percent} thin />
                        </div>
                      )}

                      <p className="text-[12px] text-ink-400 mt-2">
                        {labels.paidOf
                          .replace('{paid}', formatMoney(d.paid_amount))
                          .replace('{total}', formatMoney(d.total_amount))}
                        {!isSettled && !isPositiveMoney(d.paid_amount) && (
                          <> · {labels.noPaymentsYet}</>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!isSettled && (
                        <div className="text-end">
                          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                            {labels.remaining}
                          </p>
                          <p className="font-mono text-[19px] font-bold text-danger-700 tabular-nums leading-tight">
                            {formatMoney(d.remaining)}
                          </p>
                        </div>
                      )}
                      {/* A debt with no order_id has nothing to open — it stays
                          listed, because the balance above still counts it. */}
                      {orderId != null && (
                        <button
                          onClick={() => onViewOrder(orderId)}
                          aria-label={labels.viewOrder.replace('{id}', String(orderId))}
                          className="h-9 px-4 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                        >
                          {labels.detailsBtn}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-sand-50">
              <span className="text-[13px] text-ink-600">
                {labels.footerTotal.replace('{n}', String(unsettled.length))}
              </span>
              <span className="font-mono text-[17px] font-bold text-danger-700 tabular-nums">
                {formatMoney(shownRemaining)}{' '}
                <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
