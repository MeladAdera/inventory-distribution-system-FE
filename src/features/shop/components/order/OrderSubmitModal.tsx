import { Send } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import type { OrderableProduct } from '../../types/clientOrderProducts.types';

interface OrderSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cartItems: OrderableProduct[];
  cart: Record<number, number>;
  isSubmitting: boolean;
  labels: {
    title: string;
    intro: string;
    confirmBtn: string;
    cancelBtn: string;
  };
}

export function OrderSubmitModal({
  open,
  onClose,
  onConfirm,
  cartItems,
  cart,
  isSubmitting,
  labels,
}: OrderSubmitModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      <div className="flex flex-col max-h-52 overflow-y-auto mb-4">
        {cartItems.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            <ProductThumb id={product.id} size={28} />
            <span className="flex-1 text-[14px] text-ink-800 truncate">{product.name}</span>
            <span className="font-mono text-[13px] font-semibold text-ink-900 shrink-0">
              {cart[product.id]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancelBtn}
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {labels.confirmBtn}
        </button>
      </div>
    </Modal>
  );
}
