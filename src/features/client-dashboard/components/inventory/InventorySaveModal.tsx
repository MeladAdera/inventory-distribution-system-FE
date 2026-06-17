import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';

interface InventorySaveModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  allItems: EnrichedInventoryItem[];
  changes: Record<number, number>;
  isAdjusting: boolean;
  labels: {
    title: string;
    intro: string;
    noChanges: string;
    confirm: string;
    cancel: string;
  };
}

export function InventorySaveModal({
  open,
  onClose,
  onConfirm,
  allItems,
  changes,
  isAdjusting,
  labels,
}: InventorySaveModalProps) {
  const changedItems = allItems.filter((p) => (changes[p.id] ?? 0) !== 0);

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      {changedItems.length === 0 ? (
        <p className="text-[14px] text-ink-400 py-2">{labels.noChanges}</p>
      ) : (
        <div className="flex flex-col gap-3 mb-2 max-h-56 overflow-y-auto">
          {changedItems.map((item) => {
            const delta = changes[item.id];
            const newQty = item.current_quantity + delta;
            return (
              <div key={item.id} className="flex items-center gap-3">
                <ProductThumb id={item.product_id} size={28} />
                <span className="flex-1 text-[14px] text-ink-800 truncate">
                  {item.product_name}
                </span>
                <span className="font-mono text-[13px] font-medium text-ink-900 shrink-0">
                  {item.current_quantity} → {newQty}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isAdjusting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isAdjusting}
          className="px-4 py-2 rounded-lg bg-ink-900 text-[14px] font-medium text-amber-500 hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isAdjusting && <Loader2 size={14} className="animate-spin" />}
          {labels.confirm}
        </button>
      </div>
    </Modal>
  );
}
