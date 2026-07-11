/**
 * Format a monetary value with up to 2 decimal places and no trailing zeros,
 * so whole numbers read naturally: 25.00 → "25", 3.30 → "3.3", 32.34 → "32.34".
 * Accepts the DECIMAL-as-string values the API returns, or a number.
 */
export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : '';
}
