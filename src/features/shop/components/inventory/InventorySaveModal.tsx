import { useState } from 'react';
import { AlertTriangle, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney } from '@/common/utils/money';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';
import {
  COST_DEVIATION_WARN,
  parseCost,
  defaultCostInput,
  blendedAvg,
} from '../../utils/inventoryCost';

interface InventorySaveModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    decreaseNotes: string;
    increaseNotes: string;
    isFree: boolean;
    // Per-increase unit cost, keyed by inventory id. Absent key = inherit (omit unitCost).
    unitCosts: Record<number, number>;
  }) => Promise<void>;
  allItems: EnrichedInventoryItem[];
  changes: Record<number, number>;
  isSaving: boolean;
  labels: {
    title: string;
    intro: string;
    noChanges: string;
    confirm: string;
    cancel: string;
    decreaseSection: string;
    increaseSection: string;
    notesPlaceholder: string;
    receiptNotesLabel: string;
    increaseNotesLabel: string;
    price: string;
    markFreeLabel: string;
    markFreeHint: string;
    unitCostLabel: string;
    avgCostLabel: string;
    costWarning: string;
  };
}

export function InventorySaveModal({
  open,
  onClose,
  onConfirm,
  allItems,
  changes,
  isSaving,
  labels,
}: InventorySaveModalProps) {
  const [decreaseNotes, setDecreaseNotes] = useState('');
  const [increaseNotes, setIncreaseNotes] = useState('');
  const [isFree, setIsFree] = useState(false);
  // Per-increase unit cost as raw input strings, keyed by inventory id. A missing
  // key falls back to the prefilled avg; an empty string means "inherit" (omit).
  const [unitCosts, setUnitCosts] = useState<Record<number, string>>({});

  const decreases = allItems.filter((p) => (changes[p.id] ?? 0) < 0);
  const increases = allItems.filter((p) => (changes[p.id] ?? 0) > 0);

  function resetForm() {
    setDecreaseNotes('');
    setIncreaseNotes('');
    setIsFree(false);
    setUnitCosts({});
  }

  function handleClose() {
    if (isSaving) return;
    resetForm();
    onClose();
  }

  async function handleConfirm() {
    // Build the cost map: only include a line when a valid cost (incl. 0) is present.
    // Empty/blank → omit the key so the backend applies its inherit/seed rule.
    const unitCostMap: Record<number, number> = {};
    for (const item of increases) {
      const cost = parseCost(unitCosts[item.id] ?? defaultCostInput(item));
      if (!Number.isNaN(cost) && cost >= 0) unitCostMap[item.id] = cost;
    }

    try {
      await onConfirm({ decreaseNotes, increaseNotes, isFree, unitCosts: unitCostMap });
      resetForm();
    } catch {
      // onConfirm showed the error toast; keep inputs so the user can retry
    }
  }

  const hasChanges = decreases.length > 0 || increases.length > 0;

  return (
    <Modal open={open} onClose={handleClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      {!hasChanges ? (
        <p className="text-[14px] text-ink-400 py-2">{labels.noChanges}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Decreases section */}
          {decreases.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-danger-50 border-b border-border">
                <TrendingDown size={14} className="text-danger-500 shrink-0" />
                <span className="text-[12px] font-semibold text-danger-700 uppercase tracking-wide">
                  {labels.decreaseSection}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 p-4 max-h-44 overflow-y-auto">
                {decreases.map((item) => {
                  const delta = changes[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <ProductThumb id={item.product_id} size={28} />
                      <span className="flex-1 text-[14px] text-ink-800 truncate">
                        {item.product_name}
                      </span>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[11px] text-ink-400">
                          {labels.price}: {formatMoney(item.sale_price)}
                        </span>
                        <span className="font-mono text-[13px] font-medium text-danger-600">
                          {Math.abs(delta)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-4">
                <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
                  {labels.receiptNotesLabel}
                </label>
                <textarea
                  value={decreaseNotes}
                  onChange={(e) => setDecreaseNotes(e.target.value)}
                  placeholder={labels.notesPlaceholder}
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
                />
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-amber-600 shrink-0"
                  />
                  <span>
                    <span className="block text-[13px] font-medium text-ink-700">
                      {labels.markFreeLabel}
                    </span>
                    <span className="block text-[12px] text-ink-400">{labels.markFreeHint}</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Increases section */}
          {increases.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-border">
                <TrendingUp size={14} className="text-emerald-600 shrink-0" />
                <span className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wide">
                  {labels.increaseSection}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-4 max-h-72 overflow-y-auto">
                {increases.map((item) => {
                  const delta = changes[item.id];
                  const costStr = unitCosts[item.id] ?? defaultCostInput(item);
                  const oldQty = item.current_quantity;
                  const oldAvg = Number(item.avg_cost);
                  const hasOldAvg = Number.isFinite(oldAvg) && oldAvg > 0;
                  const addCost = parseCost(costStr);
                  const hasCost = !Number.isNaN(addCost) && addCost >= 0;
                  const newAvg = hasCost ? blendedAvg(oldQty, oldAvg, delta, addCost) : oldAvg;
                  const deviates =
                    hasCost &&
                    hasOldAvg &&
                    Math.abs(addCost - oldAvg) / oldAvg > COST_DEVIATION_WARN;

                  return (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <ProductThumb id={item.product_id} size={28} />
                        <span className="flex-1 text-[14px] text-ink-800 truncate">
                          {item.product_name}
                        </span>
                        <span className="font-mono text-[13px] font-medium text-emerald-600 shrink-0">
                          +{delta}
                        </span>
                      </div>

                      {/* Per-line unit cost + display-only blended-average preview */}
                      <div className="ps-10 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-ink-500">{labels.unitCostLabel}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            dir="ltr"
                            value={costStr}
                            onChange={(e) =>
                              setUnitCosts((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            placeholder="0.00"
                            className="w-20 px-2 py-1 text-[13px] font-mono text-ink-900 bg-page border border-border rounded-lg outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                        {hasCost ? (
                          <span className="text-[11px] font-mono text-ink-400">
                            {labels.avgCostLabel}: {hasOldAvg ? `${formatMoney(oldAvg)} → ` : ''}
                            <span className="text-ink-700 font-medium">{formatMoney(newAvg)}</span>
                          </span>
                        ) : hasOldAvg ? (
                          <span className="text-[11px] font-mono text-ink-400">
                            {labels.avgCostLabel}: {formatMoney(oldAvg)}
                          </span>
                        ) : null}
                      </div>

                      {deviates && (
                        <div className="ps-10 flex items-center gap-1.5 text-[11px] text-amber-700">
                          <AlertTriangle size={11} className="shrink-0" />
                          <span>{labels.costWarning}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 pb-4">
                <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
                  {labels.increaseNotesLabel}
                </label>
                <textarea
                  value={increaseNotes}
                  onChange={(e) => setIncreaseNotes(e.target.value)}
                  placeholder={labels.notesPlaceholder}
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={handleClose}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSaving || !hasChanges}
          className="px-4 py-2 rounded-lg bg-ink-900 text-[14px] font-medium text-amber-500 hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {labels.confirm}
        </button>
      </div>
    </Modal>
  );
}
