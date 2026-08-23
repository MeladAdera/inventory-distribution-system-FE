'use client';

import { cn } from '@/common/utils/cn';

type KpiVariant = 'default' | 'hero' | 'attention';

interface KpiCardProps {
  label: string;
  /** Pre-formatted — this component never formats money or counts itself. */
  value: React.ReactNode;
  /** One line of context under the value: a delta, a breakdown, a caveat. */
  context?: React.ReactNode;
  /**
   * `hero` is the navy headline card, one per row at most.
   * `attention` tints the card amber — for a figure that is a call to act,
   * such as shifts nobody is rota'd onto.
   */
  variant?: KpiVariant;
  className?: string;
}

const VARIANTS: Record<KpiVariant, { wrap: string; label: string; value: string }> = {
  default: {
    wrap: 'bg-paper border-border',
    label: 'text-ink-500',
    value: 'text-ink-900',
  },
  hero: {
    wrap: 'bg-ink-900 border-ink-900',
    label: 'text-ink-200',
    value: 'text-paper',
  },
  attention: {
    wrap: 'bg-warning-50 border-warning-200',
    label: 'text-warning-700',
    value: 'text-ink-900',
  },
};

export function KpiCard({ label, value, context, variant = 'default', className }: KpiCardProps) {
  const tone = VARIANTS[variant];
  return (
    <div className={cn('rounded-xl border px-4 py-3.5', tone.wrap, className)}>
      <p className={cn('text-[12px] font-medium', tone.label)}>{label}</p>
      <p
        className={cn(
          'mt-1 font-bold tabular-nums',
          variant === 'hero' ? 'text-[30px] leading-tight' : 'text-[24px] leading-tight',
          tone.value
        )}
      >
        {value}
      </p>
      {context && (
        <p
          className={cn('mt-1 text-[11.5px]', variant === 'hero' ? 'text-ink-200' : 'text-ink-500')}
        >
          {context}
        </p>
      )}
    </div>
  );
}
