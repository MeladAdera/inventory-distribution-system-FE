'use client';

import { Info, CheckCircle2 } from 'lucide-react';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import type { DebtsSummary } from '../types/debts.types';

interface OwedToWarehouseCardProps {
  summary: DebtsSummary;
  currency: string;
  labels: {
    title: string;
    remaining: string;
    billed: string;
    collected: string;
    openCount: string;
    readOnlyHint: string;
    settled: string;
  };
}

/**
 * What this shop still owes the warehouse.
 *
 * Read-only by design — there is no "pay" button. A shop owner cannot record a
 * payment against their own order-debt; only the warehouse admin can, because
 * the admin is the party physically receiving the money.
 *
 * Never netted against what customers owe the shop: the two sides answer
 * different questions and the API reports them separately.
 */
export function OwedToWarehouseCard({ summary, currency, labels }: OwedToWarehouseCardProps) {
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

  return (
    <div className="px-5 py-4 bg-paper border border-border rounded-xl">
      <p className="text-[13px] font-semibold text-ink-800 mb-3">{labels.title}</p>

      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.remaining}
          </p>
          <p className="font-mono text-[22px] font-bold text-amber-700 tabular-nums leading-tight">
            {formatMoney(summary.total_remaining)}{' '}
            <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.collected}
          </p>
          <p className="font-mono text-[15px] font-medium text-ink-700 tabular-nums">
            {formatMoney(summary.total_collected)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.billed}
          </p>
          <p className="font-mono text-[15px] font-medium text-ink-700 tabular-nums">
            {formatMoney(summary.total_billed)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
            {labels.openCount}
          </p>
          <p className="font-mono text-[15px] font-medium text-ink-700 tabular-nums">
            {summary.open_count}
          </p>
        </div>
      </div>

      <p className="flex items-start gap-1.5 mt-3 text-[12px] text-ink-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        {labels.readOnlyHint}
      </p>
    </div>
  );
}
