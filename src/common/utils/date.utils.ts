/**
 * Date helpers for "this week"-style buckets. Display formatting stays with the
 * components that need it — these only answer questions about boundaries.
 */

/**
 * Saturday. The shops on this system run a Levantine working week, so a receipt
 * raised on Sunday morning belongs to the week that just started, not the one
 * that ended — which is what a Monday-based week would say.
 */
const DEFAULT_WEEK_START = 6;

/**
 * Midnight at the start of the current week, in the viewer's timezone.
 *
 * `weekStartsOn` follows `Date.getDay()`: 0 Sunday … 6 Saturday.
 */
export function startOfWeek(
  weekStartsOn: number = DEFAULT_WEEK_START,
  now: Date = new Date()
): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  // +7 keeps the modulo positive when today falls before the week's start day.
  const daysSinceStart = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - daysSinceStart);
  return date;
}

/** True when `iso` falls in the current week. Unparseable input counts as no. */
export function isThisWeek(iso: string, weekStartsOn?: number): boolean {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time >= startOfWeek(weekStartsOn).getTime();
}
