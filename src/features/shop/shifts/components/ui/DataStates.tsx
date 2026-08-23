'use client';

import { AlertTriangle, CalendarX } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Button } from '@/common/components/ui/button';

/**
 * The four data states, as components rather than ad-hoc markup, so all three
 * shift pages fail and empty out the same way.
 *
 * Loading is a skeleton shaped like the real content, never a bare spinner: a
 * spinner tells you to wait, a skeleton tells you what is coming.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-sand-100', className)} />;
}

/** Skeleton shaped like a row of KPI cards. */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-paper px-4 py-3.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton shaped like a table: a header bar then evenly spaced rows. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-paper">
      <div className="border-b border-border bg-subtle px-4 py-2.5">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  body: string;
  /** Clearing a filter is the likelier fix than creating something, so it leads. */
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-paper px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-100 text-ink-400">
        <CalendarX size={22} />
      </div>
      <p className="mt-3 text-[15px] font-semibold text-ink-900">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">{body}</p>
      {(primaryLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {primaryLabel && <Button onClick={onPrimary}>{primaryLabel}</Button>}
          {secondaryLabel && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  /** The server's own message where there is one — it is already localised. */
  detail?: string;
  retryLabel: string;
  onRetry: () => void;
}

export function ErrorState({ title, detail, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-danger-200 bg-danger-50 px-5 py-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-danger-700">
        <AlertTriangle size={16} className="shrink-0" />
        {title}
      </p>
      {detail && <p className="mt-1 text-[13px] leading-relaxed text-ink-600">{detail}</p>}
      <Button variant="destructive" size="sm" className="mt-3" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

/**
 * For a section that has data but not enough of it — a chart with one point, a
 * grouping with no rows. The section stays put and says why, rather than
 * vanishing and leaving a hole the reader has to explain to themselves.
 */
export function InsufficientData({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-subtle px-4 py-8 text-center text-[12.5px] text-ink-500">
      {message}
    </div>
  );
}
