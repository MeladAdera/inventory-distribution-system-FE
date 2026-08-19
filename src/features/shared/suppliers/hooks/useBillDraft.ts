'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isValidMoneyInput, multiplyMoney, sumMoney } from '@/common/utils/money';
import { BILL_ITEMS_MAX } from '../types/suppliers.types';
import type { BillItemInput } from '../types/suppliers.types';

/** Why one line can't be sent yet. Only ever one at a time — the first thing wrong. */
export type BillLineError = 'quantity' | 'cost';

/** A line as the user is building it, before it becomes a `BillItemInput`. */
export interface BillDraftLine {
  /**
   * Stable identity for React and for targeted updates. Not the product id —
   * that would work today, but it ties the row's identity to a value the row
   * exists to carry rather than to the row itself.
   */
  key: string;
  productId: number;
  productName: string;
  quantity: number;
  /** Raw input text, not yet money. Kept as typed so a half-entered "12." survives. */
  unitCost: string;
}

export interface BillDraftLineView extends BillDraftLine {
  /** quantity × unitCost, or null while the cost isn't valid money yet. */
  lineTotal: string | null;
  error: BillLineError | null;
}

let nextKey = 0;
function makeKey(): string {
  nextKey += 1;
  return `line-${nextKey}`;
}

/** How long a merged line stays highlighted after a duplicate pick. */
const FLASH_MS = 1400;

/**
 * The goods half of a supplier bill, as it is being built.
 *
 * Deliberately holds no server state — it is the form's working copy, and the
 * mutation that posts it lives in `useSupplierDetail`. What it does own is
 * every rule from the handoff that the backend would otherwise reject the
 * entire payload for, so a mistake is caught in the row it was made in rather
 * than bounced back as a whole-request failure:
 *
 *   · unit cost must be > 0 — free stock owes nothing and belongs on stock-in
 *   · no product may appear on two lines
 *   · at most 200 lines
 *
 * The "lines must sum to the total exactly" rule needs no check at all: the
 * total IS the sum. The form renders `computedTotal` read-only rather than
 * asking for a figure and refusing to proceed until the two agree.
 *
 * All arithmetic goes through the minor-unit helpers in common/utils/money —
 * adding line totals as floats drifts by a fraction of a unit, and the server
 * compares in exact cents.
 */
export function useBillDraft() {
  const [lines, setLines] = useState<BillDraftLine[]>([]);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const flash = useCallback((key: string) => {
    setFlashKey(key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKey(null), FLASH_MS);
  }, []);

  const reset = useCallback(() => {
    setLines([]);
    setFlashKey(null);
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  /**
   * Put a product on the bill.
   *
   * Picking one that is already on a line MERGES rather than duplicating: that
   * line's quantity goes up by one and flashes. Two lines for the same product
   * is a 400, and a repeat pick almost always means "one more of these" rather
   * than "a second entry" — so the merge is both the correct payload and the
   * likely intent.
   *
   * `unitCost` prefills the cost, used when the product was just created and we
   * already know what it cost to buy.
   */
  const addProduct = useCallback(
    (product: { id: number; name: string }, unitCost?: string) => {
      setLines((prev) => {
        const duplicate = prev.find((l) => l.productId === product.id);
        if (duplicate) {
          flash(duplicate.key);
          return prev.map((l) =>
            l.key === duplicate.key ? { ...l, quantity: l.quantity + 1 } : l
          );
        }
        if (prev.length >= BILL_ITEMS_MAX) return prev;

        const line: BillDraftLine = {
          key: makeKey(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitCost: unitCost ?? '',
        };
        flash(line.key);
        return [...prev, line];
      });
    },
    [flash]
  );

  const updateLine = useCallback((key: string, patch: Partial<Omit<BillDraftLine, 'key'>>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const views: BillDraftLineView[] = useMemo(
    () =>
      lines.map((line) => {
        const cost = line.unitCost.trim();
        // isValidMoneyInput is "> 0 and at most 2dp", so this one check covers
        // an empty field, a malformed one, and a zero cost alike.
        const costValid = isValidMoneyInput(cost);
        const error: BillLineError | null =
          line.quantity < 1 ? 'quantity' : !costValid ? 'cost' : null;

        return {
          ...line,
          lineTotal: costValid ? multiplyMoney(cost, line.quantity) : null,
          error,
        };
      }),
    [lines]
  );

  /** The invoice total, and the only figure the bill is submitted with. */
  const computedTotal = useMemo(() => sumMoney(views.map((v) => v.lineTotal ?? '0')), [views]);

  /** Product ids already on a line — lets the picker mark them as taken. */
  const productIds = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);

  const hasLines = lines.length > 0;
  const isFull = lines.length >= BILL_ITEMS_MAX;
  const isValid = hasLines && views.every((v) => v.error === null);

  /** The `items` array to post. Only meaningful once `isValid`. */
  const toItems = useCallback(
    (): BillItemInput[] =>
      lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unitCost: l.unitCost.trim(),
      })),
    [lines]
  );

  return {
    lines: views,
    computedTotal,
    productIds,
    hasLines,
    isFull,
    isValid,
    flashKey,
    addProduct,
    updateLine,
    removeLine,
    reset,
    toItems,
  };
}
