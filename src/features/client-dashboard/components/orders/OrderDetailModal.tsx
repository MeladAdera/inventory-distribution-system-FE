import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { OrderStatus } from '@/features/orders/types/orders.types';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { ClientOrder } from '../../types/clientOrders.types';
import { cn } from '@/common/utils/cn';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  const date = new Date(iso);
  if (locale === 'ar') {
    const day = date.getDate();
    const year = date.getFullYear();
    const month = new Intl.DateTimeFormat('ar', { month: 'long' }).format(date);
    return `${day} / ${month} / ${year}`;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

interface OrderDetailModalProps {
  order: ClientOrder | null;
  open: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    productsLabel: string;
    requestedQty: string;
    price: string;
    closeBtn: string;
    statusLabels: Record<OrderStatus, string>;
  };
}

export function OrderDetailModal({ order, open, onClose, locale, labels }: OrderDetailModalProps) {
  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="lg">
      {/* Order meta */}
      <div className="flex items-center gap-4 mb-5">
        <OrderStatusBadge status={order.status} label={labels.statusLabels[order.status]} />
        <div>
          <p className="text-[16px] font-semibold text-ink-900">#{order.id}</p>
          <p className="text-[13px] text-ink-500 mt-0.5">{formatDate(order.created_at, locale)}</p>
        </div>
      </div>

      {/* Product list */}
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400 mb-3">
        {labels.productsLabel}
      </p>
      <div className="border border-border rounded-[10px] overflow-hidden mb-5">
        {order.items.map((item, i) => (
          <div
            key={item.product_id}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              i > 0 && 'border-t border-border'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ProductThumb id={item.product_id} size={28} />
              <span className="text-[13px] font-medium text-ink-800 truncate">
                {item.product_name}
              </span>
            </div>
            <div className="flex items-center gap-6 shrink-0 ms-4">
              <div className="text-end">
                <p className="text-[11px] text-ink-400">{labels.price}</p>
                <p className="font-mono text-[13px] text-ink-700">{item.price}</p>
              </div>
              <div className="text-end">
                <p className="text-[11px] text-ink-400">{labels.requestedQty}</p>
                <p className="font-mono text-[14px] font-semibold text-ink-900">{item.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
        >
          {labels.closeBtn}
        </button>
      </div>
    </Modal>
  );
}
