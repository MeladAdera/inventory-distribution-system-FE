import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
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
  isLoadingDetail: boolean;
  onConfirmReceived: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
  isConfirming: boolean;
  isCancelling: boolean;
  labels: {
    title: string;
    productsLabel: string;
    requestedQty: string;
    price: string;
    closeBtn: string;
    totalPrice: string;
    shippedHint: string;
    confirmReceivedBtn: string;
    cancelOrderBtn: string;
    statusLabels: Record<OrderStatus, string>;
  };
}

export function OrderDetailModal({
  order,
  open,
  onClose,
  locale,
  isLoadingDetail,
  onConfirmReceived,
  onCancelOrder,
  isConfirming,
  isCancelling,
  labels,
}: OrderDetailModalProps) {
  if (isLoadingDetail || !order) {
    return (
      <Modal open={open} onClose={onClose} title={labels.title} size="lg">
        <div className="flex items-center justify-center h-40">
          <Loader2 size={22} className="animate-spin text-ink-400" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="lg">
      {/* Order meta */}
      <div className="flex items-center gap-4 mb-5">
        <OrderStatusBadge status={order.status} label={labels.statusLabels[order.status]} />
        <div>
          <p className="text-[16px] font-semibold text-ink-900 ">{order.id}</p>
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
        {/* Total price row */}
        {order.total_price != null && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-sand-50">
            <span className="text-[13px] font-semibold text-ink-700">{labels.totalPrice}</span>
            <span className="font-mono text-[15px] font-bold text-ink-900">
              {order.total_price.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Shipped hint */}
      {order.status === OrderStatus.SHIPPED && (
        <p className="text-[13px] text-info-700 bg-info-100 rounded-lg px-3 py-2 mb-4">
          {labels.shippedHint}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {order.status === OrderStatus.SHIPPED && (
          <button
            onClick={() => onConfirmReceived(order.id)}
            disabled={isConfirming}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success-700 text-white text-[14px] font-semibold hover:bg-success-700/90 disabled:opacity-60 transition-colors"
          >
            {isConfirming && <Loader2 size={14} className="animate-spin" />}
            {labels.confirmReceivedBtn}
          </button>
        )}

        {order.status === OrderStatus.PENDING && (
          <button
            onClick={() => onCancelOrder(order.id)}
            disabled={isCancelling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-700 text-white text-[14px] font-semibold hover:bg-danger-700/90 disabled:opacity-60 transition-colors"
          >
            {isCancelling && <Loader2 size={14} className="animate-spin" />}
            {labels.cancelOrderBtn}
          </button>
        )}

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
