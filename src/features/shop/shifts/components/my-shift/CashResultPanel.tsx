'use client';

import { CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { compareMoney, formatMoney } from '@/common/utils/money';
import type { ShiftSession } from '../../types/shifts.types';

interface CashResultPanelProps {
  /** A closed session — every cash field is populated and frozen. */
  session: ShiftSession;
  currency: string;
  labels: {
    title: string;
    balanced: string;
    short: string;
    over: string;
    openingFloat: string;
    cashSales: string;
    cashCollections: string;
    cashPayouts: string;
    expected: string;
    counted: string;
    difference: string;
    done: string;
  };
}

/**
 * What the drawer held, shown only after the close.
 *
 * The five figures above the line are the server's frozen arithmetic — float
 * plus sales plus collections minus payouts. They are never recalculated here,
 * and cancelling a receipt next week will not move them.
 */
export function CashResultPanel({ session, currency, labels }: CashResultPanelProps) {
  const difference = session.cash_difference ?? '0.00';
  // Negative = short, positive = over, "0.00" = balanced.
  const sign = compareMoney(difference, '0.00');

  const tone =
    sign === 0
      ? {
          wrap: 'bg-success-100 text-success-700',
          icon: <CheckCircle2 size={22} />,
          text: labels.balanced,
        }
      : sign < 0
        ? {
            wrap: 'bg-danger-100 text-danger-700',
            icon: <TrendingDown size={22} />,
            text: labels.short,
          }
        : {
            wrap: 'bg-amber-100 text-amber-700',
            icon: <TrendingUp size={22} />,
            text: labels.over,
          };

  return (
    <div>
      <div className={cn('flex items-center gap-3 rounded-lg px-4 py-3', tone.wrap)}>
        {tone.icon}
        <div>
          <p className="text-[14px] font-semibold">{tone.text}</p>
          <p className="text-[13px] tabular-nums opacity-90">
            {formatMoney(difference)} {currency}
          </p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-border">
        <Line label={labels.openingFloat} value={session.opening_float} currency={currency} />
        <Line label={labels.cashSales} value={session.cash_sales} currency={currency} />
        <Line label={labels.cashCollections} value={session.cash_collections} currency={currency} />
        <Line label={labels.cashPayouts} value={session.cash_payouts} currency={currency} />
        <Line label={labels.expected} value={session.expected_cash} currency={currency} strong />
        <Line label={labels.counted} value={session.counted_cash} currency={currency} strong />
      </dl>
    </div>
  );
}

function Line({
  label,
  value,
  currency,
  strong = false,
}: {
  label: string;
  value: string | null;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className={cn('text-[13px]', strong ? 'font-medium text-ink-700' : 'text-ink-500')}>
        {label}
      </dt>
      <dd
        className={cn(
          'text-[14px] tabular-nums',
          strong ? 'font-semibold text-ink-900' : 'text-ink-700'
        )}
      >
        {formatMoney(value ?? '0.00')} {currency}
      </dd>
    </div>
  );
}
