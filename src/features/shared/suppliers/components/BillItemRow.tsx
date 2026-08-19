'use client';

import { Trash2 } from 'lucide-react';
import { formatMoney } from '@/common/utils/money';
import type { BillDraftLine, BillDraftLineView } from '../hooks/useBillDraft';

export interface BillItemLabels {
  quantity: string;
  unitCost: string;
  lineTotal: string;
  remove: string;
  errQuantity: string;
  errCost: string;
}

interface BillItemRowProps {
  line: BillDraftLineView;
  /** True just after a duplicate pick merged into this line, to show what moved. */
  flashed: boolean;
  currency: string;
  labels: BillItemLabels;
  onUpdate: (patch: Partial<Omit<BillDraftLine, 'key'>>) => void;
  onRemove: () => void;
}

/**
 * One line of goods being entered.
 *
 * Quantity is a plain field rather than a +/- stepper: deliveries arrive in
 * numbers like 21 or 144, and stepping to those is worse than typing them. The
 * stepper in the stock-in modal is fine there because it moves one product at a
 * time, by a handful.
 *
 * The line total is derived and read-only — it is the product of the two fields
 * beside it, and an editable third number would just be a way to disagree with
 * them.
 */
export function BillItemRow({
  line,
  flashed,
  currency,
  labels,
  onUpdate,
  onRemove,
}: BillItemRowProps) {
  const error =
    line.error === 'quantity' ? labels.errQuantity : line.error === 'cost' ? labels.errCost : null;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        flashed
          ? 'border-amber-500 bg-amber-50'
          : error
            ? 'border-danger-700/40 bg-paper'
            : 'border-border bg-paper'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink-900">
          {line.productName}
        </p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={labels.remove}
          title={labels.remove}
          className="-me-1 -mt-0.5 shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:bg-danger-100 hover:text-danger-700"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            {labels.quantity}
          </label>
          <input
            value={line.quantity}
            onChange={(e) => onUpdate({ quantity: Number(e.target.value.replace(/\D/g, '')) || 0 })}
            inputMode="numeric"
            dir="ltr"
            className={`w-full rounded-lg border bg-page px-2.5 py-1.5 font-mono text-[14px] tabular-nums text-ink-900 outline-none ${
              line.error === 'quantity'
                ? 'border-danger-700'
                : 'border-border focus:border-amber-500'
            }`}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            {labels.unitCost}
          </label>
          <input
            value={line.unitCost}
            onChange={(e) => onUpdate({ unitCost: e.target.value })}
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            className={`w-full rounded-lg border bg-page px-2.5 py-1.5 font-mono text-[14px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 ${
              line.error === 'cost' ? 'border-danger-700' : 'border-border focus:border-amber-500'
            }`}
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink-500">
            {labels.lineTotal}
          </label>
          <p className="px-2.5 py-1.5 font-mono text-[14px] font-semibold tabular-nums text-ink-900">
            {line.lineTotal === null ? (
              <span className="text-ink-400">—</span>
            ) : (
              <>
                {formatMoney(line.lineTotal)}{' '}
                <span className="font-sans text-[11px] font-normal text-ink-400">{currency}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {error && <p className="mt-1.5 text-[12px] text-danger-700">{error}</p>}
    </div>
  );
}
