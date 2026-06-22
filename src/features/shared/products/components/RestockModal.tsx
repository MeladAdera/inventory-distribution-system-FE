'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Minus, PackagePlus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import type { Product } from '../types/products.types';
import { ProductThumb } from './ProductThumb';

interface RestockModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, qty: number) => Promise<void>;
}

export function RestockModal({ open, product, onClose, onConfirm }: RestockModalProps) {
  const { t } = useI18n();
  const p = t.products;
  const [qty, setQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) setQty(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !product) return null;

  const adjust = (delta: number) => setQty((v) => Math.max(1, v + delta));

  const handleQtyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) setQty(val);
    else if (e.target.value === '') setQty(1);
  };

  const handleConfirm = async () => {
    if (qty < 1) return;
    setIsSubmitting(true);
    try {
      await onConfirm(product, qty);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col',
          'sm:rounded-xl sm:max-w-115',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border">
          <h2 className="text-lg font-semibold text-ink-900">{p.restock.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-sand-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Product info */}
          <div className="flex items-center gap-3.5 mb-5">
            <ProductThumb id={product.id} size={48} />
            <div>
              <p className="font-semibold text-ink-900">{product.name}</p>
              <p className="font-mono text-xs text-ink-500 mt-0.5">{product.barcode ?? '—'}</p>
            </div>
          </div>

          {/* Qty stepper */}
          <div>
            <label className="text-xs font-medium text-ink-600 block mb-2">
              {p.restock.qtyLabel}
              <span className="text-danger-700 ms-0.75">*</span>
            </label>
            <div className="flex items-center border border-border rounded-lg overflow-hidden w-fit">
              <button
                onClick={() => adjust(-1)}
                disabled={qty <= 1}
                className="w-11 h-11 flex items-center justify-center text-ink-600 hover:bg-sand-100 transition-colors disabled:opacity-35"
              >
                <Minus size={16} />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={qty}
                onChange={handleQtyInput}
                className="w-20 h-11 text-center font-mono text-[17px] font-semibold text-ink-900 border-x border-border focus:outline-none bg-paper"
                dir="ltr"
              />
              <button
                onClick={() => adjust(1)}
                className="w-11 h-11 flex items-center justify-center text-ink-600 hover:bg-sand-100 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 py-4 border-t border-border">
          <button
            onClick={handleConfirm}
            disabled={qty < 1 || isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <PackagePlus size={15} />
            {p.restock.addStock}
          </button>
          <button
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {p.restock.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
