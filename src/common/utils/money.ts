/**
 * Format a monetary value with up to 2 decimal places and no trailing zeros,
 * so whole numbers read naturally: 25.00 → "25", 3.30 → "3.3", 32.34 → "32.34".
 * Accepts the DECIMAL-as-string values the API returns, or a number.
 *
 * Display only. For arithmetic use the minor-unit helpers below.
 */
export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : '';
}

/**
 * Format a monetary value with thousands separators and exactly 2 decimals:
 * 1952.79 → "1,952.79", 145 → "145.00".
 *
 * Use this where amounts sit in a column and are meant to be compared at a
 * glance — a fixed decimal count keeps the digits aligned, and the grouping
 * makes four- and five-figure balances readable. `formatMoney` stays the
 * default for inline prose, where trailing zeros only add noise.
 *
 * Always Latin digits, even in Arabic: the rest of the app renders money with
 * `tabular-nums` in a mono face and mixing numeral systems breaks that column.
 *
 * Display only. For arithmetic use the minor-unit helpers below.
 */
export function formatMoneyGrouped(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Minor-unit arithmetic ───────────────────────────────────────────────────
// The API sends and receives every money field as a 2-decimal string ("50.00").
// Adding those as JS floats eventually yields 0.30000000000000004 and a balance
// that is wrong by a fraction of a unit, so all arithmetic happens on integer
// minor units (cents) and converts back to a string at the edges.

/** Matches a non-negative decimal with at most 2 fraction digits. */
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Parse a money string into integer minor units: "50.00" → 5000, "3.3" → 330.
 * Returns NaN for anything unparseable, so callers can guard.
 *
 * Parsing digits rather than multiplying by 100 avoids the float error that
 * `Number("10.07") * 100` (= 1006.9999…) would introduce.
 */
export function parseMoney(value: string | number): number {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim();
  const negative = raw.startsWith('-');
  const body = negative ? raw.slice(1) : raw;
  if (!MONEY_PATTERN.test(body)) return NaN;

  const [whole, fraction = ''] = body.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return negative ? -minor : minor;
}

/** Convert integer minor units back to the 2-decimal string the API expects: 5000 → "50.00". */
export function formatMinor(minor: number): string {
  if (!Number.isFinite(minor)) return '0.00';
  const rounded = Math.round(minor);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** a - b, as a money string. "30.00" - "10.00" → "20.00" */
export function subMoney(a: string | number, b: string | number): string {
  return formatMinor(parseMoney(a) - parseMoney(b));
}

/** a + b, as a money string. */
export function addMoney(a: string | number, b: string | number): string {
  return formatMinor(parseMoney(a) + parseMoney(b));
}

/**
 * Multiply money by a whole number — a line total (unit price × quantity).
 * Exact, because scaling integer minor units by an integer never loses precision.
 */
export function multiplyMoney(value: string | number, quantity: number): string {
  return formatMinor(parseMoney(value) * quantity);
}

/** Sum a list of money strings. Unparseable entries count as zero. */
export function sumMoney(values: (string | number)[]): string {
  return formatMinor(
    values.reduce<number>((total, v) => {
      const minor = parseMoney(v);
      return total + (Number.isNaN(minor) ? 0 : minor);
    }, 0)
  );
}

/** -1 if a < b, 0 if equal, 1 if a > b. Used for "amount ≤ remaining" checks. */
export function compareMoney(a: string | number, b: string | number): -1 | 0 | 1 {
  const left = parseMoney(a);
  const right = parseMoney(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** True when the value is money the API will accept: > 0 and at most 2 decimal places. */
export function isValidMoneyInput(value: string): boolean {
  const minor = parseMoney(value);
  return Number.isFinite(minor) && minor > 0;
}

/**
 * True when the value is a COUNTED amount of cash the API will accept: >= 0 and
 * at most 2 decimal places.
 *
 * Deliberately separate from `isValidMoneyInput`, which requires more than zero
 * because paying nothing or pricing something at nothing is meaningless. A count
 * is the opposite case: an empty drawer is a real observation, and the one at
 * close is the most important reading there is — refusing it would stop an
 * employee reporting a till that is empty when it should not be.
 */
export function isValidCashCount(value: string): boolean {
  const minor = parseMoney(value);
  return Number.isFinite(minor) && minor >= 0;
}

/** True when a money string is zero (or unparseable — treated as nothing owed). */
export function isZeroMoney(value: string | number): boolean {
  const minor = parseMoney(value);
  return !Number.isFinite(minor) || minor === 0;
}

/** True when a money string is greater than zero — e.g. "has this debt been paid against?" */
export function isPositiveMoney(value: string | number): boolean {
  const minor = parseMoney(value);
  return Number.isFinite(minor) && minor > 0;
}
