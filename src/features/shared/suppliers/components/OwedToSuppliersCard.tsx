'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { formatMoney, isPositiveMoney, parseMoney } from '@/common/utils/money';
import type { DebtsSummary } from '@/features/shared/debts';

/**
 * `paid` as a share of `paid + outstanding`, 0–100.
 *
 * Normalised over the two parts rather than over a separately-reported total, so
 * the bar fills exactly once even if the API's billed figure ever drifts from
 * collected + remaining. Same reasoning as OwedToWarehouseCard.
 */
function paidShare(paid: string, outstanding: string): number {
  const p = parseMoney(paid);
  const o = parseMoney(outstanding);
  if (!Number.isFinite(p) || !Number.isFinite(o)) return 0;
  const whole = p + o;
  if (whole <= 0) return p > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (p / whole) * 100));
}

interface OwedToSuppliersCardProps {
  summary: DebtsSummary;
  /** Where "manage suppliers" goes — differs by portal. */
  href: string;
  currency: string;
  labels: {
    title: string;
    remaining: string;
    paid: string;
    openBills: string;
    settled: string;
    hint: string;
    manageBtn: string;
  };
}

/**
 * What this shop still owes its own suppliers.
 *
 * The third side of the ledger, and the only one the shop settles itself: it
 * cannot pay down its warehouse debt (the warehouse records that), and it
 * collects rather than pays on the customer side. So unlike OwedToWarehouseCard
 * this one leads somewhere — the action is a step away, on the suppliers page,
 * because paying needs to pick a supplier first.
 *
 * Deliberately a summary and not a breakdown. Orders have a natural list to
 * expand into on the warehouse card; supplier bills belong to a supplier, and
 * flattening every shop's bills into one list here would answer a question
 * nobody asks.
 *
 * Never netted against the other two totals, in either direction.
 */
export function OwedToSuppliersCard({ summary, href, currency, labels }: OwedToSuppliersCardProps) {
  const owes = isPositiveMoney(summary.total_remaining);

  if (!owes) {
    return (
      <div className="flex items-center gap-2.5 px-5 py-4 bg-paper border border-border rounded-xl">
        <CheckCircle2 size={17} className="text-success-700 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink-800">{labels.title}</p>
          <p className="text-[13px] text-ink-500">{labels.settled}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-600 hover:text-amber-700 transition-colors"
        >
          {labels.manageBtn}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  const paidPercent = paidShare(summary.total_collected, summary.total_remaining);

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="text-ink-400 shrink-0" />
          <p className="text-[13px] font-semibold text-ink-800">{labels.title}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-600 text-[13px] font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          {labels.manageBtn}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>

      <div className="px-5 pt-3">
        <p className="font-mono text-[24px] font-bold tabular-nums text-danger-700">
          {formatMoney(summary.total_remaining)}{' '}
          <span className="font-sans text-[13px] font-normal text-ink-400">{currency}</span>
        </p>
        <p className="text-[12px] text-ink-400 mt-0.5">{labels.remaining}</p>
      </div>

      <div className="px-5 pt-3.5">
        <div className="flex w-full h-2.5 rounded-full bg-sand-200 overflow-hidden">
          <div className="bg-success-700" style={{ width: `${paidPercent}%` }} />
          <div className="bg-amber-500" style={{ width: `${100 - paidPercent}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-5 py-3.5">
        <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
          <span className="w-2 h-2 rounded-full shrink-0 bg-success-700" />
          {labels.paid}:{' '}
          <span className="font-mono font-semibold tabular-nums text-ink-700">
            {formatMoney(summary.total_collected)}
          </span>
        </span>
        <span className="text-[12px] text-ink-500">
          {labels.openBills}:{' '}
          <span className="font-mono font-semibold tabular-nums text-ink-700">
            {summary.open_count}
          </span>
        </span>
      </div>

      <p className="px-5 py-2.5 border-t border-border bg-page text-[12px] text-ink-400">
        {labels.hint}
      </p>
    </div>
  );
}
