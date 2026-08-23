'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { formatWeekRange } from '../../utils/time.utils';

export const SCHEDULE_VIEWS = ['day', 'week', 'list'] as const;
export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

interface WeekToolbarProps {
  weekStart: string;
  onShift: (weeks: number) => void;
  onToday: () => void;
  view: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  timezone: string | null;
  labels: {
    today: string;
    prevWeek: string;
    nextWeek: string;
    views: Record<ScheduleView, string>;
  };
}

export function WeekToolbar({
  weekStart,
  onShift,
  onToday,
  view,
  onViewChange,
  timezone,
  labels,
}: WeekToolbarProps) {
  const { locale, dir } = useI18n();
  const isRtl = dir === 'rtl';
  // Chevrons point at the direction of travel, which mirrors in Arabic.
  const Back = isRtl ? ChevronRight : ChevronLeft;
  const Forward = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-paper px-3 py-2.5">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => onShift(-1)} label={labels.prevWeek}>
            <Back size={16} />
          </IconBtn>
          <button
            type="button"
            onClick={onToday}
            className="h-8 rounded-lg border border-border px-3 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-sand-100"
          >
            {labels.today}
          </button>
          <IconBtn onClick={() => onShift(1)} label={labels.nextWeek}>
            <Forward size={16} />
          </IconBtn>
        </div>

        {/* A date range is a numeric run; without dir=ltr the two ends swap in
            Arabic and the week reads backwards. */}
        <span dir="ltr" className="text-[14px] font-semibold text-ink-900">
          {formatWeekRange(weekStart, locale)}
        </span>

        {timezone && <span className="text-[12px] text-ink-400">{timezone}</span>}
      </div>

      <div className="flex rounded-lg border border-border p-0.5">
        {SCHEDULE_VIEWS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={cn(
              'rounded-md px-3 py-1 text-[13px] font-medium transition-colors',
              view === id ? 'bg-ink-900 text-paper' : 'text-ink-500 hover:text-ink-800'
            )}
          >
            {labels.views[id]}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-600 transition-colors hover:bg-sand-100"
    >
      {children}
    </button>
  );
}
