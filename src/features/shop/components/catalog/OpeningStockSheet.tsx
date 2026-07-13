import { useEffect, useState } from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { BottomSheet } from '@/common/layout';

export interface OpeningStockLabels {
  title: string;
  hint: string;
  save: string;
  skip: string;
}

interface OpeningStockSheetProps {
  open: boolean;
  productName: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (quantity: number) => void;
  labels: OpeningStockLabels;
}

export function OpeningStockSheet({
  open,
  productName,
  isSaving,
  onClose,
  onSave,
  labels,
}: OpeningStockSheetProps) {
  const [qty, setQty] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (open) {
      setQty(0);
      setInputValue('');
    }
  }, [open]);

  function setQuantity(value: number) {
    const next = Math.max(0, value);
    setQty(next);
    setInputValue(next === 0 ? '' : String(next));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputValue(raw);
    if (raw === '') {
      setQty(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) setQty(Math.max(0, parsed));
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={labels.title}>
      <p className="text-[15px] font-semibold text-ink-900">{productName}</p>
      <p className="text-[13px] text-ink-500 mt-0.5 mb-4">{labels.hint}</p>

      <div className="flex items-center rounded-2xl border border-border bg-paper shadow-sm overflow-hidden mb-4">
        <button
          onClick={() => setQuantity(qty - 1)}
          disabled={qty <= 0 || isSaving}
          className="w-12 h-12 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
        >
          <Minus size={15} strokeWidth={2.5} />
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setInputValue(qty === 0 ? '' : String(qty))}
          placeholder="0"
          dir="ltr"
          disabled={isSaving}
          className="flex-1 bg-transparent text-center outline-none font-mono text-[20px] font-bold tabular-nums text-ink-900 placeholder:text-ink-300"
        />

        <button
          onClick={() => setQuantity(qty + 1)}
          disabled={isSaving}
          className="w-12 h-12 flex items-center justify-center text-ink-400 hover:text-ink-700 transition-colors shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </div>

      <button
        onClick={() => onSave(qty)}
        disabled={qty <= 0 || isSaving}
        className={cn(
          'w-full h-11 rounded-lg text-[14px] font-semibold text-white transition-colors',
          'inline-flex items-center justify-center gap-2',
          qty <= 0 || isSaving
            ? 'bg-amber-500/50 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-600'
        )}
      >
        {isSaving && <Loader2 size={15} className="animate-spin" />}
        {labels.save}
      </button>
      <button
        onClick={onClose}
        disabled={isSaving}
        className="w-full pt-3 text-[13px] text-ink-400 hover:text-ink-600 transition-colors"
      >
        {labels.skip}
      </button>
    </BottomSheet>
  );
}
