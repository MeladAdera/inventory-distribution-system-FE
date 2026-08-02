'use client';

import { useI18n } from '@/providers/I18nProvider';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { useClientOrderDetail } from '../../hooks/useClientOrders';
import { OrderDetailModal } from './OrderDetailModal';

interface OrderLookupModalProps {
  /** Null keeps the modal closed and the request idle. */
  orderId: number | null;
  onClose: () => void;
}

/**
 * Opens one order as a record — line items, totals, and what is still owed on it.
 *
 * The debts page needs the order modal to answer "what was this debt for?", but
 * not its confirm-received / cancel actions, and threading the ten-key label
 * bundle through a second page would duplicate it. So this wrapper owns the
 * lookup: it reads the labels itself and passes no action handlers, which is
 * what makes OrderDetailModal render read-only.
 */
export function OrderLookupModal({ orderId, onClose }: OrderLookupModalProps) {
  const { t, locale } = useI18n();
  const ords = t.client.orders;
  const { order, isLoading } = useClientOrderDetail(orderId);

  const statusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: ords.status.pending,
    [OrderStatus.PROCESSING]: ords.status.processing,
    [OrderStatus.SHIPPED]: ords.status.shipped,
    [OrderStatus.RECEIVED]: ords.status.received,
    [OrderStatus.COMPLETED]: ords.status.completed,
    [OrderStatus.CANCELLED]: ords.status.cancelled,
  };

  return (
    <OrderDetailModal
      order={order}
      open={orderId !== null}
      onClose={onClose}
      locale={locale}
      isLoadingDetail={isLoading}
      labels={{
        title: ords.modal.title,
        productsLabel: ords.modal.productsLabel,
        requestedQty: ords.modal.requestedQty,
        price: ords.modal.price,
        closeBtn: ords.modal.closeBtn,
        totalPrice: ords.modal.totalPrice,
        shippedHint: ords.modal.shippedHint,
        confirmReceivedBtn: ords.modal.confirmReceivedBtn,
        cancelOrderBtn: ords.modal.cancelOrderBtn,
        statusLabels,
      }}
    />
  );
}
