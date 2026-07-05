'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { useI18n } from '@/providers/I18nProvider';
import {
  useStockSyncQueue,
  discardSyncEntry,
  type StockSyncItem,
} from '@/features/shared/inventory/offline/stockSyncEngine';

interface SyncConflictModalProps {
  open: boolean;
  onClose: () => void;
}

// Collect the items the server rejected within one queued Save.
function conflictedItems(items: StockSyncItem[]): StockSyncItem[] {
  return items.filter((i) => i.status === 'conflict');
}

export function SyncConflictModal({ open, onClose }: SyncConflictModalProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const c = t.offline.conflict;
  const { entries } = useStockSyncQueue();

  const conflicted = entries.filter((e) => e.status === 'conflict');

  async function resolve(id: string, closeAfter: boolean) {
    await discardSyncEntry(id);
    // The optimistic quantities are wrong (server never applied them) — refetch truth.
    await queryClient.invalidateQueries({ queryKey: ['client-inventory'] });
    await queryClient.invalidateQueries({ queryKey: ['client-inventory-products'] });
    if (closeAfter || conflicted.length <= 1) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={c.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{c.intro}</p>

      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {conflicted.map((entry) => {
          const items = [
            ...conflictedItems(entry.op.decreases),
            ...conflictedItems(entry.op.increases),
          ];
          const errorMsg = entry.op.decreaseError ?? items.find((i) => i.error)?.error ?? '';
          return (
            <div key={entry.id} className="rounded-lg border border-border p-3 flex flex-col gap-2">
              <ul className="flex flex-col gap-1.5">
                {items.map((item) => {
                  const isIncrease = item.delta > 0;
                  const qty = Math.abs(item.delta);
                  return (
                    <li key={item.inventoryId} className="flex items-center gap-2 text-[13px]">
                      {isIncrease ? (
                        <TrendingUp size={14} className="text-success-600 shrink-0" />
                      ) : (
                        <TrendingDown size={14} className="text-danger-600 shrink-0" />
                      )}
                      <span className="font-medium text-ink-800 truncate">{item.productName}</span>
                      <span className="text-ink-500 shrink-0">
                        {(isIncrease ? c.increaseLabel : c.decreaseLabel).replace(
                          '{qty}',
                          String(qty)
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {errorMsg && (
                <p className="text-[12px] text-danger-700 bg-danger-50 rounded px-2 py-1">
                  {c.itemError.replace('{error}', errorMsg)}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => resolve(entry.id, false)}
                  className="px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                >
                  {c.discard}
                </button>
                <button
                  onClick={() => resolve(entry.id, true)}
                  className="px-3 h-8 rounded-lg bg-ink-900 text-amber-500 text-[13px] font-semibold hover:bg-ink-800 transition-colors"
                >
                  {c.editAgain}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 h-9 rounded-lg text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors"
        >
          {c.close}
        </button>
      </div>
    </Modal>
  );
}
