import { useState } from 'react';
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';

interface InventorySaveModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: {
    decreaseNotes: string;
    increaseNotes: string;
    isFree: boolean;
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

  const decreases = allItems.filter((p) => (changes[p.id] ?? 0) < 0);
  const increases = allItems.filter((p) => (changes[p.id] ?? 0) > 0);

  function handleClose() {
    if (isSaving) return;
    setDecreaseNotes('');
    setIncreaseNotes('');
    setIsFree(false);
    onClose();
  }

  async function handleConfirm() {
    try {
      await onConfirm({ decreaseNotes, increaseNotes, isFree });
      setDecreaseNotes('');
      setIncreaseNotes('');
      setIsFree(false);
    } catch {
      // onConfirm showed the error toast; keep notes so the user can retry
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
                          {labels.price}: {item.price}
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
              <div className="flex flex-col gap-2.5 p-4 max-h-44 overflow-y-auto">
                {increases.map((item) => {
                  const delta = changes[item.id];
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <ProductThumb id={item.product_id} size={28} />
                      <span className="flex-1 text-[14px] text-ink-800 truncate">
                        {item.product_name}
                      </span>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[11px] text-ink-400">
                          {labels.price}: {item.price}
                        </span>
                        <span className="font-mono text-[13px] font-medium text-emerald-600">
                          {delta}
                        </span>
                      </div>
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
