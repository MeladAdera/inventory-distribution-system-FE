'use client';

import { PackagePlus } from 'lucide-react';
import { formatMoney } from '@/common/utils/money';
import { BillItemRow, type BillItemLabels } from './BillItemRow';
import type { BillDraftLine, BillDraftLineView } from '../hooks/useBillDraft';

export interface BillItemsTableLabels extends BillItemLabels {
  empty: string;
  computedTotal: string;
  computedTotalHint: string;
  lineCount: string;
  full: string;
}

interface BillItemsTableProps {
  lines: BillDraftLineView[];
  flashKey: string | null;
  isFull: boolean;
  currency: string;
  labels: BillItemsTableLabels;
  onUpdate: (key: string, patch: Partial<Omit<BillDraftLine, 'key'>>) => void;
  onRemove: (key: string) => void;
}

/**
 * The goods on a bill being recorded, and what they add up to.
 *
 * The total is stated here rather than asked for. The server requires the lines
 * to sum to `totalAmount` to the cent with no tolerance, so a typed total is a
 * number the user has to reconcile by hand against one the form already knows —
 * every mismatch a dead end. Deriving it makes the commonest rejection
 * impossible to reach.
 */
export function BillItemsTable({
  lines,
  flashKey,
  isFull,
  currency,
  labels,
  onUpdate,
  onRemove,
}: BillItemsTableProps) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-page px-4 py-8 text-center">
        <PackagePlus size={20} className="text-ink-400" />
        <p className="text-[13px] text-ink-500">{labels.empty}</p>
      </div>
    );
  }

  // Recomputed from what is on screen rather than passed in, so the figure the
  // user reads is provably the sum of the rows above it.
  const total = lines.reduce((sum, l) => sum + Number(l.lineTotal ?? 0), 0);

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line) => (
        <BillItemRow
          key={line.key}
          line={line}
          flashed={line.key === flashKey}
          currency={currency}
          labels={labels}
          onUpdate={(patch) => onUpdate(line.key, patch)}
          onRemove={() => onRemove(line.key)}
        />
      ))}

      {isFull && (
        <p className="rounded-lg bg-sand-100 px-3 py-2 text-[12px] text-ink-600">{labels.full}</p>
      )}

      <div className="mt-1 rounded-lg border border-border bg-page px-3.5 py-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-ink-700">{labels.computedTotal}</span>
          <span className="font-mono text-[16px] font-bold tabular-nums text-ink-900">
            {formatMoney(total)}{' '}
            <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
          </span>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">
          {labels.lineCount.replace('{n}', String(lines.length))} · {labels.computedTotalHint}
        </p>
      </div>
    </div>
  );
}
