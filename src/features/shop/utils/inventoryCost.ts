import { formatMoney } from '@/common/utils/money';
import type { EnrichedInventoryItem } from '../types/clientInventory.types';

// Pure helpers for the per-line unit-cost capture in the stock-increase flow
// (see InventorySaveModal). The backend owns the authoritative average; these
// only drive input defaults, parsing, the preview, and the fat-finger warning.

// Warn when the entered unit cost deviates from the current average by more than
// this fraction — a likely fat-finger (e.g. 80 instead of 8). Non-blocking.
export const COST_DEVIATION_WARN = 0.5;

/** Parse a cost input string → number, or NaN for empty/invalid (empty = "inherit"). */
export function parseCost(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

/** Prefill an increased line's cost with its current avg — but only when there's a
 *  real basis (>0). Avg 0/absent → leave empty so we don't send an accidental 0 (=free). */
export function defaultCostInput(item: EnrichedInventoryItem): string {
  const avg = Number(item.avg_cost);
  return Number.isFinite(avg) && avg > 0 ? formatMoney(avg) : '';
}

/** Display-only blended average (backend is the source of truth). */
export function blendedAvg(
  oldQty: number,
  oldAvg: number,
  addQty: number,
  addCost: number
): number {
  if (oldQty <= 0) return addCost;
  return (oldQty * oldAvg + addQty * addCost) / (oldQty + addQty);
}
