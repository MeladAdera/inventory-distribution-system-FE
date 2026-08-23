'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { WEEKDAYS, type OpeningHoursDay, type Weekday } from '../../types/shifts.types';
import { fromISODate, toPickerValue, weekdayNames } from '../../utils/time.utils';
import { ShiftEntryCard } from './ShiftEntryCard';
import type { ScheduleEntry } from '../../hooks/useWeekSchedule';

export type ScheduleView = 'day' | 'week' | 'list';

interface ScheduleBoardProps {
  view: ScheduleView;
  dates: string[];
  entriesByWeekday: Map<Weekday, ScheduleEntry[]>;
  days: OpeningHoursDay[];
  canAddSlot: (weekday: Weekday) => boolean;
  /** Which day the `day` view shows. */
  activeWeekday: Weekday;
  onActiveWeekdayChange: (weekday: Weekday) => void;
  locale: string;
  currency: string;
  onAdd: (weekday: Weekday) => void;
  onEdit: (entry: ScheduleEntry) => void;
  onAssign: (entry: ScheduleEntry) => void;
  onRemove: (entry: ScheduleEntry) => void;
  onOpenSession: (entry: ScheduleEntry) => void;
  labels: {
    closedDay: string;
    empty: string;
    addSlot: string;
    addForDay: string;
    full: string;
    card: React.ComponentProps<typeof ShiftEntryCard>['labels'];
  };
}

/**
 * The week's shifts in three shapes off one set of entries.
 *
 * `week` is the seven-column board an owner scans; `day` is one column at full
 * width, which is what a phone gets by default; `list` is the whole week
 * flattened for a straight read. Splitting them by view rather than by
 * breakpoint means the choice is the owner's on any screen — the page merely
 * picks a sensible starting view for the width.
 */
export function ScheduleBoard(props: ScheduleBoardProps) {
  const { view } = props;
  if (view === 'day') return <DayView {...props} />;
  if (view === 'list') return <ListView {...props} />;
  return <WeekView {...props} />;
}

// ── Week ────────────────────────────────────────────────────────────────────

function WeekView(props: ScheduleBoardProps) {
  const { dates, entriesByWeekday, days, canAddSlot, locale, currency, labels } = props;
  const short = weekdayNames(locale, 'short');
  const long = weekdayNames(locale);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-paper p-2">
      {/* ~160px a column. At the old 800px each day got 114px, which left a
          shift name about six characters before the ellipsis. */}
      <div className="grid min-w-280 grid-cols-7 gap-2">
        {WEEKDAYS.map((weekday) => {
          const day = days.find((d) => d.weekday === weekday);
          const closed = day?.is_closed ?? true;
          const entries = entriesByWeekday.get(weekday) ?? [];

          return (
            <div key={weekday} className="flex flex-col gap-2">
              <DayHeader
                name={short[weekday]}
                title={long[weekday]}
                date={dates[weekday]}
                day={day}
                closed={closed}
                closedLabel={labels.closedDay}
                locale={locale}
              />
              <div
                className={cn(
                  'flex min-h-28 flex-col gap-2 rounded-lg p-1.5',
                  closed ? 'bg-sand-100/50' : 'bg-page'
                )}
              >
                {entries.map((entry) => (
                  <ShiftEntryCard
                    key={entry.key}
                    entry={entry}
                    currency={currency}
                    onEdit={() => props.onEdit(entry)}
                    onAssign={() => props.onAssign(entry)}
                    onRemove={() => props.onRemove(entry)}
                    onOpenSession={() => props.onOpenSession(entry)}
                    labels={labels.card}
                  />
                ))}
                {entries.length === 0 && (
                  <p className="px-1 py-3 text-center text-[11.5px] text-ink-faint">
                    {closed ? labels.closedDay : labels.empty}
                  </p>
                )}
                {!closed && (
                  <AddButton
                    onClick={() => props.onAdd(weekday)}
                    disabled={!canAddSlot(weekday)}
                    label={labels.addSlot}
                    fullLabel={labels.full}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day ─────────────────────────────────────────────────────────────────────

function DayView(props: ScheduleBoardProps) {
  const { dates, entriesByWeekday, days, canAddSlot, activeWeekday, locale, currency, labels } =
    props;
  const short = weekdayNames(locale, 'short');
  const long = weekdayNames(locale);
  const day = days.find((d) => d.weekday === activeWeekday);
  const closed = day?.is_closed ?? true;
  const entries = entriesByWeekday.get(activeWeekday) ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* Day switcher — seven pills, so a phone can move around the week
          without a horizontal board. */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {WEEKDAYS.map((weekday) => {
          const isClosed = days.find((d) => d.weekday === weekday)?.is_closed ?? true;
          const active = weekday === activeWeekday;
          return (
            <button
              key={weekday}
              type="button"
              onClick={() => props.onActiveWeekdayChange(weekday)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                active
                  ? 'border-ink-900 bg-ink-900 text-paper'
                  : isClosed
                    ? 'border-border text-ink-faint'
                    : 'border-border text-ink-600 hover:bg-sand-100'
              )}
            >
              {short[weekday]}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-paper p-3">
        <DayHeader
          name={long[activeWeekday]}
          date={dates[activeWeekday]}
          day={day}
          closed={closed}
          closedLabel={labels.closedDay}
          locale={locale}
          inline
        />
        <div className="mt-3 flex flex-col gap-2">
          {entries.map((entry) => (
            <ShiftEntryCard
              key={entry.key}
              entry={entry}
              currency={currency}
              onEdit={() => props.onEdit(entry)}
              onAssign={() => props.onAssign(entry)}
              onRemove={() => props.onRemove(entry)}
              onOpenSession={() => props.onOpenSession(entry)}
              labels={labels.card}
            />
          ))}
          {entries.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              {closed ? labels.closedDay : labels.empty}
            </p>
          )}
          {!closed && (
            <AddButton
              onClick={() => props.onAdd(activeWeekday)}
              disabled={!canAddSlot(activeWeekday)}
              label={labels.addForDay}
              fullLabel={labels.full}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── List ────────────────────────────────────────────────────────────────────

function ListView(props: ScheduleBoardProps) {
  const { dates, entriesByWeekday, days, locale, currency, labels } = props;
  const long = weekdayNames(locale);

  return (
    <div className="flex flex-col gap-4">
      {WEEKDAYS.map((weekday) => {
        const entries = entriesByWeekday.get(weekday) ?? [];
        const day = days.find((d) => d.weekday === weekday);
        const closed = day?.is_closed ?? true;
        // A closed day with nothing on it adds a heading and no information.
        if (closed && entries.length === 0) return null;

        return (
          <section key={weekday}>
            <DayHeader
              name={long[weekday]}
              date={dates[weekday]}
              day={day}
              closed={closed}
              closedLabel={labels.closedDay}
              locale={locale}
              inline
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <ShiftEntryCard
                  key={entry.key}
                  entry={entry}
                  currency={currency}
                  onEdit={() => props.onEdit(entry)}
                  onAssign={() => props.onAssign(entry)}
                  onRemove={() => props.onRemove(entry)}
                  onOpenSession={() => props.onOpenSession(entry)}
                  labels={labels.card}
                />
              ))}
              {entries.length === 0 && (
                <p className="py-3 text-[13px] text-ink-faint">{labels.empty}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Bits ────────────────────────────────────────────────────────────────────

function DayHeader({
  name,
  title,
  date,
  day,
  closed,
  closedLabel,
  locale,
  inline = false,
}: {
  name: string;
  title?: string;
  date: string;
  day: OpeningHoursDay | undefined;
  closed: boolean;
  closedLabel: string;
  locale: string;
  inline?: boolean;
}) {
  const dayNumber = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
    fromISODate(date)
  );

  return (
    <div className={cn(inline ? 'flex items-baseline justify-between gap-2' : 'text-center')}>
      <p className="truncate text-[13px] font-semibold text-ink-800" title={title}>
        {name} <span className="font-normal text-ink-400">{dayNumber}</span>
      </p>
      <p
        className="whitespace-nowrap text-[11.5px] tabular-nums text-ink-faint"
        dir={closed ? undefined : 'ltr'}
      >
        {closed || !day
          ? closedLabel
          : `${toPickerValue(day.open_time)}–${toPickerValue(day.close_time)}`}
      </p>
    </div>
  );
}

function AddButton({
  onClick,
  disabled,
  label,
  fullLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  fullLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? fullLabel : label}
      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-[12px] font-medium text-ink-500 transition-colors hover:border-amber-500 hover:text-amber-700 disabled:pointer-events-none disabled:opacity-40"
    >
      <Plus size={13} />
      {label}
    </button>
  );
}
