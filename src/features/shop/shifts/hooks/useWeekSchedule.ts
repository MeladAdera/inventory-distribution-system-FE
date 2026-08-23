'use client';

import { useMemo } from 'react';
import { useOpeningHours } from './useOpeningHours';
import { useShiftTemplates } from './useShiftTemplates';
import { useShiftSessions } from './useShiftSessions';
import {
  MINUTES_IN_DAY,
  fromISODate,
  timeToMinutes,
  toPickerValue,
  weekDates,
} from '../utils/time.utils';
import {
  ShiftSessionStatus,
  type OpeningHoursDay,
  type ShiftSessionRow,
  type ShiftTemplate,
  type Weekday,
} from '../types/shifts.types';

// A week of shifts is small; this only exists so a busy week is never silently
// truncated by the endpoint's default page size.
const SESSIONS_LIMIT = 100;

/**
 * How a slot in the visible week reads.
 *
 * `completed` and `open` come from a real session. `upcoming` and `missed` are
 * INFERRED from the plan — the API has no notion of a shift that should have
 * happened and didn't — so they describe the rota, never the till.
 */
export type ScheduleEntryState = 'completed' | 'open' | 'upcoming' | 'missed';

export interface ScheduleEntry {
  key: string;
  /** The `YYYY-MM-DD` this slot falls on inside the visible week. */
  date: string;
  weekday: Weekday;
  name: string;
  /** Session times when it was worked, planned times otherwise. */
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  template: ShiftTemplate | null;
  session: ShiftSessionRow | null;
  state: ScheduleEntryState;
  /** A planned slot with an empty rota — the thing the week view is for. */
  isUnstaffed: boolean;
  /** A session that ran against no slot at all. */
  isOffSchedule: boolean;
}

export interface WeekStats {
  scheduledShifts: number;
  coveredMinutes: number;
  unstaffedShifts: number;
  closedDays: OpeningHoursDay[];
}

/** When a slot's window ends, honouring a shift that runs past midnight. */
function slotEnd(date: string, startTime: string, endTime: string): Date {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const minutes = end <= start ? end + MINUTES_IN_DAY : end;
  const at = fromISODate(date);
  at.setMinutes(at.getMinutes() + minutes);
  return at;
}

/** Real elapsed time of a session — not the planned length of its slot. */
function sessionMinutes(session: ShiftSessionRow, now: number): number {
  const from = new Date(session.opened_at).getTime();
  const to = session.closed_at ? new Date(session.closed_at).getTime() : now;
  return Math.max(0, Math.round((to - from) / 60_000));
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * The plan and the fact, overlaid for one week.
 *
 * Templates are weekday-shaped and dateless; sessions are dated. The grid needs
 * both — a slot that was worked should show what actually happened, and one that
 * wasn't should still show it was scheduled. Merging happens here so the grid
 * stays presentational and the rule lives in one place.
 *
 * Everything comes from existing endpoints; nothing new is asked of the server.
 */
export function useWeekSchedule(weekStartISO: string) {
  const dates = useMemo(() => weekDates(weekStartISO), [weekStartISO]);

  const hours = useOpeningHours();
  const templates = useShiftTemplates();
  const sessions = useShiftSessions({
    from: dates[0],
    to: dates[6],
    limit: SESSIONS_LIMIT,
  });

  const entriesByWeekday = useMemo(() => {
    const now = Date.now();
    const map = new Map<Weekday, ScheduleEntry[]>();

    for (let weekday = 0 as Weekday; weekday <= 6; weekday = (weekday + 1) as Weekday) {
      const date = dates[weekday];
      const slots = templates.byWeekday.get(weekday) ?? [];
      const onThisDay = sessions.sessions.filter((s) => s.business_date === date);
      // Sessions get claimed by their slot as we go; whatever is left ran
      // outside the plan and is appended to the day on its own.
      const claimed = new Set<number>();
      const entries: ScheduleEntry[] = [];

      for (const template of slots) {
        const session =
          onThisDay.find((s) => s.shift_template_id === template.id && !claimed.has(s.id)) ?? null;
        if (session) claimed.add(session.id);

        const worked = session !== null;
        const state: ScheduleEntryState = worked
          ? session!.status === ShiftSessionStatus.CLOSED
            ? 'completed'
            : 'open'
          : slotEnd(date, template.start_time, template.end_time).getTime() < now
            ? 'missed'
            : 'upcoming';

        entries.push({
          key: `t${template.id}-${date}`,
          date,
          weekday,
          name: template.name,
          startTime: worked ? hhmm(session!.opened_at) : toPickerValue(template.start_time),
          endTime: worked
            ? session!.closed_at
              ? hhmm(session!.closed_at)
              : null
            : toPickerValue(template.end_time),
          durationMinutes: worked ? sessionMinutes(session!, now) : template.duration_minutes,
          template,
          session,
          state,
          isUnstaffed: template.assignees.length === 0,
          isOffSchedule: false,
        });
      }

      for (const session of onThisDay) {
        if (claimed.has(session.id)) continue;
        entries.push({
          key: `s${session.id}`,
          date,
          weekday,
          // Named by the server when it knew the slot, otherwise left to the UI.
          name: session.shift_template_name ?? '',
          startTime: hhmm(session.opened_at),
          endTime: session.closed_at ? hhmm(session.closed_at) : null,
          durationMinutes: sessionMinutes(session, now),
          template: null,
          session,
          state: session.status === ShiftSessionStatus.CLOSED ? 'completed' : 'open',
          isUnstaffed: false,
          isOffSchedule: true,
        });
      }

      map.set(weekday, entries);
    }

    return map;
  }, [dates, templates.byWeekday, sessions.sessions]);

  const stats: WeekStats = useMemo(() => {
    const all = templates.templates;
    return {
      scheduledShifts: all.length,
      // Server-computed lengths, summed. Never derived from the times.
      coveredMinutes: all.reduce((sum, t) => sum + t.duration_minutes, 0),
      unstaffedShifts: all.filter((t) => t.assignees.length === 0).length,
      closedDays: hours.days.filter((d) => d.is_closed),
    };
  }, [templates.templates, hours.days]);

  return {
    dates,
    entriesByWeekday,
    stats,
    days: hours.days,
    timezone: hours.timezone,
    byWeekday: templates.byWeekday,
    canAddSlot: templates.canAddSlot,
    isLoading: hours.isLoading || templates.isLoading,
    /** Sessions failing must not blank the plan — the grid still has a job. */
    isSessionsLoading: sessions.isLoading,
    error: hours.error ?? templates.error,
    sessionsError: sessions.error,
  };
}
