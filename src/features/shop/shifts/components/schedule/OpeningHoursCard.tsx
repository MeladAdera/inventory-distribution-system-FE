'use client';

import { useEffect, useState } from 'react';
import { Loader2, Moon } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Button } from '@/common/components/ui/button';
import {
  MAX_SLOTS_PER_WEEKDAY,
  WEEKDAYS,
  type OpeningHourInput,
  type OpeningHoursDay,
  type Weekday,
} from '../../types/shifts.types';
import { timeToMinutes, toPickerValue, weekdayNames } from '../../utils/time.utils';
import { TimeSelect } from './TimeSelect';

/** How many equal shifts the split helper offers. */
const SPLIT_CHOICES = [2, 3, 4] as const;

interface OpeningHoursCardProps {
  days: OpeningHoursDay[];
  timezone: string | null;
  locale: string;
  onSave: (days: OpeningHourInput[]) => Promise<void>;
  isSaving: boolean;
  /** Splits one day's window into N equal slots. Offered only on empty days. */
  onSplit: (weekday: Weekday, count: number) => Promise<void>;
  splittingWeekday: Weekday | null;
  /** Existing slot count per weekday — a day with slots cannot be split again. */
  slotCounts: Map<Weekday, number>;
  labels: {
    title: string;
    subtitle: string;
    closedLabel: string;
    opensLabel: string;
    closesLabel: string;
    endOfDay: string;
    timezone: string;
    save: string;
    unsaved: string;
    splitLabel: string;
    splitUnit: string;
    splitHint: string;
    splitBusy: string;
  };
}

export function OpeningHoursCard({
  days,
  timezone,
  locale,
  onSave,
  isSaving,
  onSplit,
  splittingWeekday,
  slotCounts,
  labels,
}: OpeningHoursCardProps) {
  // Local draft: all seven rows are edited together and saved in one PUT, since
  // the API rejects a partial week outright.
  const [draft, setDraft] = useState<OpeningHourInput[]>([]);

  useEffect(() => {
    if (days.length === 0) return;
    setDraft(
      WEEKDAYS.map((w) => {
        const day = days.find((d) => d.weekday === w);
        return {
          weekday: w,
          openTime: toPickerValue(day?.open_time ?? '00:00:00'),
          closeTime: toPickerValue(day?.close_time ?? '00:00:00'),
          isClosed: day?.is_closed ?? true,
        };
      })
    );
  }, [days]);

  const names = weekdayNames(locale);

  function patch(weekday: Weekday, changes: Partial<OpeningHourInput>) {
    setDraft((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...changes } : d)));
  }

  // A closed day keeps its times server-side, so only `isClosed` is compared —
  // reading "00:00" as closed would be exactly the mistake the API warns about.
  const isDirty = draft.some((d) => {
    const saved = days.find((s) => s.weekday === d.weekday);
    if (!saved) return true;
    return (
      d.isClosed !== saved.is_closed ||
      d.openTime !== toPickerValue(saved.open_time) ||
      d.closeTime !== toPickerValue(saved.close_time)
    );
  });

  return (
    <section className="rounded-xl border border-border bg-paper p-5">
      <header className="mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-semibold text-ink-900">{labels.title}</h2>
          {timezone && (
            <span className="text-[12px] text-ink-400">
              {labels.timezone}: {timezone}
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-ink-500">{labels.subtitle}</p>
      </header>

      <ul className="divide-y divide-border">
        {draft.map((day) => {
          const closed = day.isClosed ?? false;
          // Written earlier than the open time, so the day trades past midnight.
          const overnight = !closed && timeToMinutes(day.closeTime) <= timeToMinutes(day.openTime);
          const existingSlots = slotCounts.get(day.weekday) ?? 0;
          const canSplit = !closed && existingSlots === 0 && !isDirty;

          return (
            <li key={day.weekday} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-24 shrink-0 text-[14px] font-medium text-ink-800">
                  {names[day.weekday]}
                </span>

                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] text-ink-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-600"
                    checked={closed}
                    onChange={(e) => patch(day.weekday, { isClosed: e.target.checked })}
                  />
                  {labels.closedLabel}
                </label>

                <div
                  className={cn(
                    'flex flex-1 items-center gap-2 transition-opacity',
                    closed && 'pointer-events-none opacity-40'
                  )}
                >
                  <div className="min-w-28 flex-1">
                    <TimeSelect
                      value={day.openTime}
                      onChange={(v) => patch(day.weekday, { openTime: v })}
                      disabled={closed}
                      endOfDayLabel={labels.endOfDay}
                      ariaLabel={`${names[day.weekday]} — ${labels.opensLabel}`}
                    />
                  </div>
                  <span className="text-ink-400">–</span>
                  <div className="min-w-28 flex-1">
                    <TimeSelect
                      value={day.closeTime}
                      onChange={(v) => patch(day.weekday, { closeTime: v })}
                      disabled={closed}
                      endOfDayLabel={labels.endOfDay}
                      ariaLabel={`${names[day.weekday]} — ${labels.closesLabel}`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 ps-27">
                {overnight && (
                  <span className="flex items-center gap-1 text-[12px] text-ink-400">
                    <Moon size={12} />
                    {/* Not an error: 18:00 → 02:00 is a legitimate late-night day. */}
                    {day.openTime} → {day.closeTime}
                  </span>
                )}

                {canSplit && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[12px] text-ink-400">{labels.splitLabel}</span>
                    {SPLIT_CHOICES.map((count) => (
                      <button
                        key={count}
                        type="button"
                        disabled={splittingWeekday !== null}
                        onClick={() => onSplit(day.weekday, count)}
                        className="rounded-full border border-border px-2 py-0.5 text-[12px] font-medium text-ink-600 transition-colors hover:bg-sand-100 disabled:opacity-50"
                        title={labels.splitHint}
                      >
                        {count}
                      </button>
                    ))}
                    <span className="text-[12px] text-ink-400">
                      {splittingWeekday === day.weekday ? labels.splitBusy : labels.splitUnit}
                    </span>
                  </span>
                )}

                {existingSlots >= MAX_SLOTS_PER_WEEKDAY && (
                  <span className="text-[12px] text-ink-400">{existingSlots}/4</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-end gap-3">
        {isDirty && <span className="text-[12px] text-amber-700">{labels.unsaved}</span>}
        <Button onClick={() => onSave(draft)} disabled={isSaving || !isDirty}>
          {isSaving && <Loader2 size={15} className="animate-spin" />}
          {labels.save}
        </Button>
      </div>
    </section>
  );
}
