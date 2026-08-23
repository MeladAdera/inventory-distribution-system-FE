'use client';

import { cn } from '@/common/utils/cn';

/**
 * Shift states as the UI shows them.
 *
 * `COMPLETED` and `OPEN` come straight from the API's `status`. `MISSED` and
 * `UPCOMING` do NOT exist server-side — they are inferred for a planned slot in
 * the selected week that has no session against it, judged by whether its window
 * has already passed. Treat them as a reading of the plan, never as a fact about
 * the till.
 */
export type ShiftStatusKind = 'completed' | 'open' | 'upcoming' | 'missed' | 'cancelled';

const TONES: Record<ShiftStatusKind, string> = {
  completed: 'bg-success-50 text-success-700 border-success-200',
  open: 'bg-warning-50 text-warning-700 border-warning-200',
  upcoming: 'bg-warning-50 text-warning-700 border-warning-200',
  missed: 'bg-danger-50 text-danger-700 border-danger-200',
  cancelled: 'bg-neutral-50 text-ink-500 border-border',
};

interface StatusBadgeProps {
  kind: ShiftStatusKind;
  label: string;
  className?: string;
}

export function StatusBadge({ kind, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        TONES[kind],
        className
      )}
    >
      {label}
    </span>
  );
}
