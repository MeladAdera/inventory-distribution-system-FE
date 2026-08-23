'use client';

import { cn } from '@/common/utils/cn';
import { compareMoney, formatMoneyGrouped } from '@/common/utils/money';

export type VarianceTone = 'pos' | 'neg' | 'zero';

/** The one place the short/over/balanced rule is decided. */
export function varianceTone(value: string): VarianceTone {
  const sign = compareMoney(value, '0.00');
  return sign === 0 ? 'zero' : sign < 0 ? 'neg' : 'pos';
}

const TEXT_TONE: Record<VarianceTone, string> = {
  pos: 'text-success-700',
  neg: 'text-danger-700',
  zero: 'text-ink-500',
};

const FILL_TONE: Record<VarianceTone, string> = {
  pos: 'bg-success-50 text-success-700 border-success-200',
  neg: 'bg-danger-50 text-danger-700 border-danger-200',
  zero: 'bg-neutral-50 text-ink-500 border-border',
};

interface VarianceValueProps {
  /** Money string, or null when the shift has not been counted yet. */
  value: string | null;
  placeholder?: string;
  /** `filled` draws the tinted chip used in reconciliation rows and badges. */
  variant?: 'text' | 'filled';
  currency?: string;
  className?: string;
}

/**
 * A cash difference, always as sign + number.
 *
 * Colour is never the only signal — `+222`, `−10` and `0` each read correctly in
 * greyscale and to anyone who cannot separate the red from the green. The value
 * is the server's frozen `cash_difference` and is never recomputed here, since
 * the five cash figures are fixed at the close and cancelling a receipt later
 * must not move them.
 *
 * `formatMoneyGrouped` already renders the minus for a negative, so only the
 * plus has to be added.
 */
export function VarianceValue({
  value,
  placeholder = '—',
  variant = 'text',
  currency,
  className,
}: VarianceValueProps) {
  if (value === null) {
    return <span className={cn('text-ink-400', className)}>{placeholder}</span>;
  }

  const tone = varianceTone(value);
  const body = (
    <>
      {tone === 'pos' && '+'}
      {formatMoneyGrouped(value)}
      {currency ? ` ${currency}` : ''}
    </>
  );

  if (variant === 'filled') {
    return (
      <span
        dir="ltr"
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-semibold tabular-nums',
          FILL_TONE[tone],
          className
        )}
      >
        {body}
      </span>
    );
  }

  return (
    <span dir="ltr" className={cn('font-semibold tabular-nums', TEXT_TONE[tone], className)}>
      {body}
    </span>
  );
}
