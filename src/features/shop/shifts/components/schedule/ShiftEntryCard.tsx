'use client';

import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped } from '@/common/utils/money';
import { formatDuration } from '../../utils/time.utils';
import { StatusBadge, type ShiftStatusKind } from '../ui/StatusBadge';
import { VarianceValue } from '../ui/VarianceValue';
import type { ScheduleEntry } from '../../hooks/useWeekSchedule';

/** Avatars beyond this collapse into a count. */
const VISIBLE_ASSIGNEES = 3;

/**
 * The 3px inline-start bar, which is the fastest read on the whole grid.
 * Uses a logical border so it flips to the right edge in Arabic by itself.
 */
const ACCENT: Record<ShiftStatusKind, string> = {
  completed: 'border-s-amber-600',
  open: 'border-s-warning-700',
  upcoming: 'border-s-amber-500',
  missed: 'border-s-danger-700',
  cancelled: 'border-s-ink-200',
};

interface ShiftEntryCardProps {
  entry: ScheduleEntry;
  currency: string;
  onEdit?: () => void;
  onAssign?: () => void;
  onRemove?: () => void;
  onOpenSession?: () => void;
  labels: {
    states: Record<'completed' | 'open' | 'upcoming' | 'missed', string>;
    offSchedule: string;
    unnamed: string;
    running: string;
    invoices: string;
    unassigned: string;
    edit: string;
    remove: string;
    assign: string;
    more: string;
  };
}

export function ShiftEntryCard({
  entry,
  currency,
  onEdit,
  onAssign,
  onRemove,
  onOpenSession,
  labels,
}: ShiftEntryCardProps) {
  // An unstaffed slot carries its own red line, so a second "upcoming" chip on
  // the same card would say less and crowd more.
  const showBadge = !(entry.isUnstaffed && entry.session === null);
  const accent: ShiftStatusKind = entry.isUnstaffed && !entry.session ? 'cancelled' : entry.state;
  const session = entry.session;
  const assignees = entry.template?.assignees ?? [];
  const visible = assignees.slice(0, VISIBLE_ASSIGNEES);
  const overflow = assignees.length - visible.length;

  return (
    <div
      className={cn(
        // overflow-hidden is load-bearing: without it the figures below spill
        // out of a narrow column and render loose in the gutter between days.
        'overflow-hidden rounded-lg border border-s-[3px] border-border bg-paper p-2.5 transition-colors',
        ACCENT[accent],
        session && 'cursor-pointer hover:bg-subtle'
      )}
      onClick={session ? onOpenSession : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">
          {entry.name || (entry.isOffSchedule ? labels.offSchedule : labels.unnamed)}
        </p>
        {showBadge && <StatusBadge kind={entry.state} label={labels.states[entry.state]} />}
      </div>

      {/* Times and duration are one LTR run: in Arabic the range would
          otherwise reverse and name the wrong start. */}
      {/* The paragraph stays in the page's direction so it aligns under the name
          above it; only the time range itself is forced LTR, or the two ends of
          the range swap in Arabic. */}
      <p className="mt-1 truncate text-[12px] tabular-nums text-ink-600">
        <span dir="ltr">
          {entry.startTime} – {entry.endTime ?? '…'}
        </span>
        {entry.durationMinutes !== null && (
          <span className="ms-1.5 text-ink-400">· {formatDuration(entry.durationMinutes)}</span>
        )}
      </p>

      {/* Who — the person who actually worked it beats the rota that planned it. */}
      {session ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-600">
          <Avatar name={session.user_name} />
          <span className="min-w-0 truncate">{session.user_name}</span>
        </p>
      ) : entry.isUnstaffed ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-danger-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger-700" />
          <span className="min-w-0 truncate">{labels.unassigned}</span>
        </p>
      ) : (
        <div className="mt-1.5 flex items-center gap-1">
          {visible.map((a) => (
            <Avatar key={a.id} name={a.name} title={a.name} />
          ))}
          {overflow > 0 && (
            <span className="text-[11px] text-ink-400">
              {labels.more.replace('{count}', String(overflow))}
            </span>
          )}
        </div>
      )}

      {/* What it took, once the drawer has been counted. Wraps rather than
          compressing: three figures forced onto one line is what pushed the
          variance outside the card in a narrow day column. */}
      {session && session.status === 'CLOSED' && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border pt-2 text-[12px]">
          <span className="truncate text-ink-400">
            {labels.invoices.replace('{count}', String(session.receipt_count))}
          </span>
          <span dir="ltr" className="ms-auto truncate tabular-nums text-ink-700">
            {formatMoneyGrouped(session.sales_total)} {currency}
          </span>
          <VarianceValue value={session.cash_difference} className="shrink-0 text-[12px]" />
        </div>
      )}

      {/* Planning actions belong to the slot, not to a shift already worked. */}
      {entry.template && (
        <div
          className="mt-2 flex items-center gap-0.5 border-t border-border pt-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <IconBtn onClick={onAssign} label={labels.assign}>
            <UserPlus size={13} />
          </IconBtn>
          <IconBtn onClick={onEdit} label={labels.edit}>
            <Pencil size={13} />
          </IconBtn>
          <IconBtn onClick={onRemove} label={labels.remove} danger>
            <Trash2 size={13} />
          </IconBtn>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, title }: { name: string; title?: string }) {
  return (
    <span
      title={title}
      className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function IconBtn({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick?: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded p-1 transition-colors',
        danger
          ? 'text-ink-400 hover:bg-danger-50 hover:text-danger-700'
          : 'text-ink-400 hover:bg-sand-100 hover:text-ink-700'
      )}
    >
      {children}
    </button>
  );
}
