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
 * The week as seven columns, Sunday first — weekday 0 is Sunday throughout,
 * matching the API and `getDay()`, with no conversion anywhere.
 *
 * Columns scroll horizontally on a phone rather than reflowing: a week that
 * wraps into two rows stops reading as a week.
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
  const names = weekdayNames(locale, 'short');
  const longNames = weekdayNames(locale);

  return (
    <section className="rounded-xl border border-border bg-paper p-5">
      <header className="mb-4">
        <h2 className="text-[16px] font-semibold text-ink-900">{labels.title}</h2>
        <p className="mt-1 text-[13px] text-ink-500">{labels.subtitle}</p>
      </header>

      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="grid min-w-160 grid-cols-7 gap-2 px-1">
          {WEEKDAYS.map((weekday) => {
            const slots = byWeekday.get(weekday) ?? [];
            const day = days.find((d) => d.weekday === weekday);
            const closed = day?.is_closed ?? true;
            const full = !canAddSlot(weekday);

            return (
              <div key={weekday} className="flex flex-col gap-2">
                <div className="text-center">
                  <p
                    className="truncate text-[13px] font-semibold text-ink-800"
                    title={longNames[weekday]}
                  >
                    {names[weekday]}
                  </p>
                  <p className="text-[11px] tabular-nums text-ink-400">
                    {closed
                      ? labels.closedDay
                      : `${toPickerValue(day!.open_time)}–${toPickerValue(day!.close_time)}`}
                  </p>
                </div>

                <div
                  className={cn(
                    'flex min-h-24 flex-col gap-2 rounded-lg p-1',
                    closed ? 'bg-sand-100/60' : 'bg-page'
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
                    <p className="px-1 py-2 text-center text-[11px] text-ink-400">
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
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-[11px] font-medium text-ink-500 transition-colors hover:border-amber-500 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <Plus size={12} />
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
