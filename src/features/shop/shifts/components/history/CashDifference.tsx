'use client';

import { cn } from '@/common/utils/cn';
import { compareMoney, formatMoney } from '@/common/utils/money';

interface CashDifferenceProps {
  /** Money string, or null on a shift that has not been counted yet. */
  value: string | null;
  /** Shown in place of a figure when nothing has been counted. */
  placeholder?: string;
  className?: string;
}

/**
 * The one place the short/over/balanced colour rule lives.
 *
 * Negative is short, positive is over, `"0.00"` balances — read from the
 * server's own `cash_difference` and never recomputed here, because the five
 * cash figures are frozen at the close and would drift the moment a receipt was
 * cancelled afterwards.
 */
export function CashDifference({ value, placeholder = '—', className }: CashDifferenceProps) {
  if (value === null) {
    return <span className={cn('text-ink-400', className)}>{placeholder}</span>;
  }

  const sign = compareMoney(value, '0.00');
  return (
    <span
      dir="ltr"
      className={cn(
        'tabular-nums font-medium',
        sign === 0 ? 'text-success-700' : sign < 0 ? 'text-danger-700' : 'text-amber-700',
        className
      )}
    >
      {sign > 0 && '+'}
      {formatMoney(value)}
    </span>
  );
}
