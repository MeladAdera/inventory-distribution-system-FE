'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import {
  WEEKDAYS,
  type OpeningHoursDay,
  type ShiftTemplate,
  type Weekday,
} from '../../types/shifts.types';
import { toPickerValue, weekdayNames } from '../../utils/time.utils';
import { SlotCard } from './SlotCard';

interface WeekGridProps {
  byWeekday: Map<Weekday, ShiftTemplate[]>;
  days: OpeningHoursDay[];
  canAddSlot: (weekday: Weekday) => boolean;
  locale: string;
  onAdd: (weekday: Weekday) => void;
  onEdit: (template: ShiftTemplate) => void;
  onAssign: (template: ShiftTemplate) => void;
  onRemove: (template: ShiftTemplate) => void;
  labels: {
    title: string;
    subtitle: string;
    addSlot: string;
    full: string;
    closedDay: string;
    noSlots: string;
    unassigned: string;
    edit: string;
    remove: string;
    assign: string;
    more: string;
  };
}

/**
 * The week's shift plan. Weekday 0 is Sunday throughout, matching the API and
 * `getDay()`, with no conversion anywhere.
 *
 * One markup tree, two shapes. On a phone each day is a full-width block
 * stacked down the page, because seven columns squeezed into 390px turned slot
 * names into single letters and wrapped every time range onto three lines. From
 * `md` up it becomes the seven-column week an owner wants to scan, scrolling
 * sideways rather than reflowing — a week that wraps stops reading as a week.
 */
export function WeekGrid({
  byWeekday,
  days,
  canAddSlot,
  locale,
  onAdd,
  onEdit,
  onAssign,
  onRemove,
  labels,
}: WeekGridProps) {
  const shortNames = weekdayNames(locale, 'short');
  const longNames = weekdayNames(locale);

  return (
    <section className="rounded-xl border border-border bg-paper p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-[16px] font-semibold text-ink-900">{labels.title}</h2>
        <p className="mt-1 text-[13px] text-ink-500">{labels.subtitle}</p>
      </header>

      <div className="md:-mx-1 md:overflow-x-auto md:pb-1">
        <div className="flex flex-col gap-3 md:grid md:min-w-160 md:grid-cols-7 md:gap-2 md:px-1">
          {WEEKDAYS.map((weekday) => {
            const slots = byWeekday.get(weekday) ?? [];
            const day = days.find((d) => d.weekday === weekday);
            const closed = day?.is_closed ?? true;
            const full = !canAddSlot(weekday);
            const hours = day
              ? `${toPickerValue(day.open_time)}–${toPickerValue(day.close_time)}`
              : '';

            return (
              <div
                key={weekday}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border border-border p-3',
                  // The card chrome is a mobile affordance; the desktop grid
                  // separates days by column instead.
                  'md:rounded-none md:border-0 md:p-0',
                  closed && 'bg-sand-100/50 md:bg-transparent'
                )}
              >
                <div className="flex items-baseline justify-between gap-2 md:block md:text-center">
                  <p className="text-[14px] font-semibold text-ink-800 md:truncate md:text-[13px]">
                    <span className="md:hidden">{longNames[weekday]}</span>
                    <span className="hidden md:inline" title={longNames[weekday]}>
                      {shortNames[weekday]}
                    </span>
                  </p>
                  {/* dir=ltr only on the range: an RTL paragraph reorders the two
                      times around the neutral dash and shows closing first. */}
                  <p
                    className="whitespace-nowrap text-[12px] tabular-nums text-ink-400 md:text-[11px]"
                    dir={closed ? undefined : 'ltr'}
                  >
                    {closed ? labels.closedDay : hours}
                  </p>
                </div>

                <div
                  className={cn(
                    'grid grid-cols-1 gap-2 sm:grid-cols-2',
                    'md:flex md:min-h-24 md:flex-col md:rounded-lg md:p-1',
                    closed ? 'md:bg-sand-100/60' : 'md:bg-page'
                  )}
                >
                  {slots.map((template) => (
                    <SlotCard
                      key={template.id}
                      template={template}
                      onEdit={() => onEdit(template)}
                      onAssign={() => onAssign(template)}
                      onRemove={() => onRemove(template)}
                      labels={labels}
                    />
                  ))}

                  {slots.length === 0 && (
                    <p className="px-1 py-2 text-[12px] text-ink-400 md:text-center md:text-[11px]">
                      {closed ? labels.closedDay : labels.noSlots}
                    </p>
                  )}

                  {/* Adding to a closed day is rejected with shift.DAY_CLOSED,
                      so the affordance is withheld rather than offered to fail. */}
                  {!closed && (
                    <button
                      type="button"
                      onClick={() => onAdd(weekday)}
                      disabled={full}
                      title={full ? labels.full : labels.addSlot}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-[12px] font-medium text-ink-500 transition-colors hover:border-amber-500 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-40 md:py-1.5 md:text-[11px]"
                    >
                      <Plus size={13} />
                      {labels.addSlot}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
