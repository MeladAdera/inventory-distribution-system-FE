import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney } from '@/common/utils/money';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import type { EnrichedInventoryItem } from '../../types/clientInventory.types';

interface SetPriceModalProps {
  open: boolean;
  onClose: () => void;
  item: EnrichedInventoryItem | null;
  onSave: (salePrice: number) => Promise<void>;
  isSaving: boolean;
  labels: {
    title: string;
    priceLabel: string;
    catalogDefault: string;
    avgCost: string;
    profitPerUnit: string;
    margin: string;
    save: string;
    cancel: string;
  };
}

export function SetPriceModal({
  open,
  onClose,
  item,
  onSave,
  isSaving,
  labels,
}: SetPriceModalProps) {
  const [price, setPrice] = useState('');

  // Prefill with the current selling price whenever a new item is opened.
  useEffect(() => {
    if (open && item) setPrice(formatMoney(item.sale_price));
  }, [open, item]);

  if (!item) return null;

  const priceNum = Number(price);
  const valid = price.trim() !== '' && Number.isFinite(priceNum) && priceNum > 0;
  const avgCost = Number(item.avg_cost);
  const hasCost = Number.isFinite(avgCost) && avgCost > 0;
  const profit = priceNum - avgCost;
  const marginPct = valid && priceNum > 0 ? (profit / priceNum) * 100 : 0;
  const loss = valid && hasCost && profit < 0;

  function handleClose() {
    if (isSaving) return;
    onClose();
  }

  async function handleSave() {
    if (!valid) return;
    try {
      await onSave(Number(priceNum.toFixed(2)));
      onClose();
    } catch {
      // onSave surfaced the error toast (incl. 403); keep the input for retry.
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={labels.title} size="sm">
      <div className="flex items-center gap-3 mb-4">
        <ProductThumb id={item.product_id} size={40} imageUrl={item.image_url} />
        <span className="text-[15px] font-semibold text-ink-900">{item.product_name}</span>
      </div>

      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
        {labels.priceLabel}
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        dir="ltr"
        autoFocus
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="0.00"
        className="w-full px-3 py-2 text-[15px] font-mono text-ink-900 bg-page border border-border rounded-lg outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      {/* Reference + live margin */}
      <div className="mt-3 flex flex-col gap-1 text-[12px] font-mono">
        <div className="flex justify-between text-ink-400">
          <span>{labels.catalogDefault}</span>
          <span>{formatMoney(item.price)}</span>
        </div>
        {hasCost && (
          <>
            <div className="flex justify-between text-ink-400">
              <span>{labels.avgCost}</span>
              <span>{formatMoney(avgCost)}</span>
            </div>
            {valid && (
              <div
                className={`flex justify-between font-medium ${loss ? 'text-danger-600' : 'text-emerald-700'}`}
              >
                <span>{labels.profitPerUnit}</span>
                <span>
                  {formatMoney(profit)} ({marginPct.toFixed(0)}% {labels.margin})
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={handleClose}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !valid}
          className="px-4 py-2 rounded-lg bg-ink-900 text-[14px] font-medium text-amber-500 hover:bg-ink-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {labels.save}
        </button>
      </div>
    </Modal>
  );
}
