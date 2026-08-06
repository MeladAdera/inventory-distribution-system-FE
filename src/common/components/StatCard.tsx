'use client';

import { cn } from '@/common/utils/cn';

export type StatTone = 'neutral' | 'amber' | 'danger' | 'success';

const TONE_CLASS: Record<StatTone, string> = {
  neutral: 'text-ink-900',
  amber: 'text-amber-700',
  danger: 'text-danger-700',
  success: 'text-success-700',
};

interface StatCardProps {
  label: string;
  /** Pre-formatted — this component never rounds, groups or localizes. */
  value: string;
  /** Trailing unit, e.g. a currency symbol. */
  suffix?: string;
  tone?: StatTone;
  /**
   * `number` sets the value in the mono face with tabular figures so a row of
   * cards lines up; `text` is for values that aren't quantities (a date, a
   * name) and would look like a serial number in mono.
   */
  variant?: 'number' | 'text';
  isLoading?: boolean;
  /** Makes the card a button — use when it filters the list below it. */
  onClick?: () => void;
}

/**
 * One headline figure. Deliberately dumb: callers pass a finished string, so a
 * card never disagrees with the table under it about how a number is written.
 */
export function StatCard({
  label,
  value,
  suffix,
  tone = 'neutral',
  variant = 'number',
  isLoading = false,
  onClick,
}: StatCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'bg-paper border border-border rounded-xl px-4 py-3.5 sm:px-5 sm:py-4',
        onClick &&
          'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-sm'
      )}
    >
      <p className="text-[12px] font-medium text-ink-500">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-7 w-20 rounded skeleton-shimmer" />
      ) : (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold leading-tight',
              variant === 'number'
                ? 'font-mono text-[22px] sm:text-[26px] tabular-nums'
                : 'text-[17px] sm:text-[19px]',
              TONE_CLASS[tone]
            )}
          >
            {value}
          </span>
          {suffix && <span className="text-[12px] text-ink-400">{suffix}</span>}
        </p>
      )}
    </div>
  );
}

/** Two across on a phone, four on a wide screen. */
export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{children}</div>;
}
