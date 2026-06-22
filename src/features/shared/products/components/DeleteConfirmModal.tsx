'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import type { Product } from '../types/products.types';

interface DeleteConfirmModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product) => Promise<void>;
}

export function DeleteConfirmModal({ open, product, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useI18n();
  const p = t.products;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !product) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(product);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/32 backdrop-blur-[2px]" />

      <div
        className={cn(
          'relative z-10 w-full bg-paper flex flex-col',
          'sm:rounded-xl sm:max-w-110',
          'rounded-t-2xl sm:rounded-t-xl',
          'animate-pop-in'
        )}
      >
        {/* Body */}
        <div className="px-6 pt-6 pb-5 flex gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-danger-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-danger-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{p.delete.title}</p>
            <p className="text-sm text-ink-600 mt-1">{product.name}</p>
            <p className="text-[13px] text-ink-500 mt-2">{p.delete.warning}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 px-6 pb-6">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 h-10 px-5 bg-danger-700 hover:bg-danger-700/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <Trash2 size={15} />
            {p.delete.delete}
          </button>
          <button
            onClick={onClose}
            className="h-10 px-5 border border-border rounded-lg text-sm text-ink-700 font-medium hover:bg-sand-100 transition-colors"
          >
            {p.delete.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
