import { useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import type { SellTrayItem } from './SellTray';

interface SellConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string, isFree: boolean) => Promise<void>;
  items: SellTrayItem[];
  totalUnits: number;
  isSubmitting: boolean;
  labels: {
    title: string;
    intro: string;
    totalUnits: string;
    notesLabel: string;
    notesPlaceholder: string;
    confirmBtn: string;
    cancelBtn: string;
    markFreeLabel: string;
    markFreeHint: string;
  };
}

export function SellConfirmModal({
  open,
  onClose,
  onConfirm,
  items,
  totalUnits,
  isSubmitting,
  labels,
}: SellConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [isFree, setIsFree] = useState(false);

  function handleClose() {
    if (isSubmitting) return;
    setNotes('');
    setIsFree(false);
    onClose();
  }

  async function handleConfirm() {
    try {
      await onConfirm(notes, isFree);
      setNotes('');
      setIsFree(false);
    } catch {
      // onConfirm showed the error toast; keep notes so the user can retry
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      <div className="flex flex-col max-h-52 overflow-y-auto mb-4">
        {items.map(({ item, qty }) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            <ProductThumb id={item.product_id} size={28} />
            <span className="flex-1 text-[14px] text-ink-800 truncate">{item.product_name}</span>
            <span className="font-mono text-[13px] font-semibold text-ink-900 shrink-0">
              ×{qty}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-ink-600 mb-4">
        {labels.totalUnits}:{' '}
        <span className="font-mono font-bold text-ink-900 tabular-nums">{totalUnits}</span>
      </p>

      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
        {labels.notesLabel}
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
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
          <span className="block text-[13px] font-medium text-ink-700">{labels.markFreeLabel}</span>
          <span className="block text-[12px] text-ink-400">{labels.markFreeHint}</span>
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancelBtn}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || items.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
          {labels.confirmBtn}
        </button>
      </div>
    </Modal>
  );
}
