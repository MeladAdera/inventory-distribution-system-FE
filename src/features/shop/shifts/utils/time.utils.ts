// Wall-clock time arithmetic for opening hours and shift slots.
//
// Two conventions from the API make naive Date maths wrong here, so everything
// below works in minutes-from-midnight instead:
//
//   * `"24:00"` means END OF DAY and is NOT `"00:00"`. Collapsing the two turns
//     a full trading day into a zero-length one.
//   * A close EARLIER than its open means the window runs past midnight
//     (18:00 → 02:00 is eight hours, not minus twenty).
//
// Pure functions, no React — the server is still the authority on slot validity
// and on `duration_minutes`. These exist to build inputs and previews, never to
// second-guess a rejection.

export const MINUTES_IN_DAY = 1440;

/** Granularity of every time picker in the feature. */
export const TIME_STEP_MINUTES = 15;

/** `"08:00"` or `"08:00:00"` → 480. `"24:00"` → 1440. */
export function timeToMinutes(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/**
 * 480 → `"08:00"`. 1440 → `"24:00"` (end of day, deliberately not `"00:00"`).
 * Anything past a day wraps: 1560 → `"02:00"`.
 */
export function minutesToTime(minutes: number): string {
  if (minutes === MINUTES_IN_DAY) return '24:00';
  const wrapped = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Trims the API's `HH:MM:SS` to the `HH:MM` a picker holds. */
export function toPickerValue(time: string): string {
  return minutesToTime(timeToMinutes(time));
}

/**
 * How long a window lasts, honouring both conventions above.
 *
 * Only for previewing a window the user is still editing. A saved slot's length
 * comes from the server's `duration_minutes`, which is computed against that
 * day's opening hours and is the only figure allowed on screen.
 */
export function windowMinutes(start: string, end: string): number {
  const from = timeToMinutes(start);
  const to = timeToMinutes(end);
  return to > from ? to - from : to + MINUTES_IN_DAY - from;
}

/** `"2h 30m"`, `"8h"`, `"45m"`. */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Every selectable time, `00:00` … `23:45`, then `24:00` for end of day. */
export function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let m = 0; m < MINUTES_IN_DAY; m += TIME_STEP_MINUTES) options.push(minutesToTime(m));
  options.push('24:00');
  return options;
}

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const EXTENDED_ARABIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Arabic-Indic and extended Arabic digits → Latin, so an AR keyboard types fine. */
function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => {
    const arabic = ARABIC_INDIC_DIGITS.indexOf(d);
    return String(arabic >= 0 ? arabic : EXTENDED_ARABIC_DIGITS.indexOf(d));
  });
}

/**
 * Read a time a person typed, in whatever shape they typed it.
 *
 * `"8"`, `"8:5"`, `"830"`, `"08.30"`, `"٠٨:٣٠"` and `"08:00:00"` all resolve;
 * anything that cannot be read returns null so the caller can keep the previous
 * value rather than silently writing a wrong one.
 *
 * Hour 24 is accepted only as exactly `24:00` — it means end of day, and
 * `24:30` is not a time.
 */
export function parseTimeInput(raw: string): string | null {
  const value = toLatinDigits(raw).trim();
  if (!value) return null;

  let hours: number;
  let minutes: number;

  const withMinutes = /^(\d{1,2})[:.\s]?(\d{2})(?::\d{2})?$/.exec(value);
  const hourOnly = /^(\d{1,2})[:.]?$/.exec(value);

  if (withMinutes) {
    hours = Number(withMinutes[1]);
    minutes = Number(withMinutes[2]);
  } else if (hourOnly) {
    hours = Number(hourOnly[1]);
    minutes = 0;
  } else {
    return null;
  }

  if (minutes > 59 || hours > 24) return null;
  if (hours === 24 && minutes !== 0) return null;
  return minutesToTime(hours * 60 + minutes);
}

export interface SlotWindow {
  startTime: string;
  endTime: string;
}

/**
 * Carve a day's trading window into `count` back-to-back slots.
 *
 * Interior boundaries are snapped to the picker's step so every generated time
 * is one the editor can actually select afterwards; the final boundary is
 * forced back to the exact closing time so the chain always ends where the day
 * does, however the rounding fell.
 *
 * The slots this produces TOUCH — 08:00–16:00 and 16:00–24:00. That is adjacent,
 * not overlapping, and the server accepts it.
 */
export function splitWindow(open: string, close: string, count: number): SlotWindow[] {
  const start = timeToMinutes(open);
  const total = windowMinutes(open, close);
  if (count < 1 || total <= 0) return [];

  const boundaries: number[] = [];
  for (let i = 0; i <= count; i += 1) {
    const raw = (total * i) / count;
    const snapped = Math.round(raw / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
    boundaries.push(start + snapped);
  }
  // Exact ends beat tidy ones: never leave a gap before closing.
  boundaries[count] = start + total;

  const slots: SlotWindow[] = [];
  for (let i = 0; i < count; i += 1) {
    if (boundaries[i + 1] <= boundaries[i]) continue; // rounding collapsed it
    slots.push({
      startTime: minutesToTime(boundaries[i]),
      endTime: minutesToTime(boundaries[i + 1]),
    });
  }
  return slots;
}

// ── Week arithmetic ─────────────────────────────────────────────────────────
//
// All of it works on LOCAL date parts, never UTC. `business_date` is a plain
// `YYYY-MM-DD` with no zone attached, so pushing it through UTC would shift the
// day for anyone east or west of Greenwich and file a shift under the wrong
// date — the exact bug the API warns about from the other direction.

/** `YYYY-MM-DD` from a Date's local parts. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses `YYYY-MM-DD` into a local midnight Date, not a UTC one. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * The Sunday that opens this date's week — Sunday because weekday 0 is Sunday
 * throughout the API, matching `getDay()`.
 */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

/** The seven `YYYY-MM-DD` dates of the week containing `weekStartISO`. */
export function weekDates(weekStartISO: string): string[] {
  const start = fromISODate(weekStartISO);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

/**
 * `23 – 29 أغسطس 2026`, collapsing the month and year when the week does not
 * straddle them so the label stays short.
 */
export function formatWeekRange(weekStartISO: string, locale: string): string {
  const start = fromISODate(weekStartISO);
  const end = addDays(start, 6);
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const dayOnly = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const full = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });

  return sameMonth
    ? `${dayOnly.format(start)} – ${full.format(end)}`
    : `${dayMonth.format(start)} – ${full.format(end)}`;
}

/**
 * Localised weekday names indexed 0–6, Sunday first — the API's own ordering,
 * which matches JavaScript `getDay()`. 2024-01-07 was a Sunday; the offsets run
 * from there so the labels never depend on today's date.
 */
export function weekdayNames(locale: string, style: 'long' | 'short' = 'long'): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(2024, 0, 7 + i))));
}
