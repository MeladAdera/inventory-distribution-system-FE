'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { ordersApi } from '@/features/orders/api/orders.api';
import { OrderStatus } from '@/features/orders/types/orders.types';
import type { Order } from '@/features/orders/types/orders.types';
import { useClientOrders } from '../hooks/useClientOrders';
import { OrdersTableCard } from './orders/OrdersTableCard';
import { OrderDetailModal } from './orders/OrderDetailModal';
import type { ClientOrder, ClientStatusFilter } from '../types/clientOrders.types';

export function ClientOrdersPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ords = t.client.orders;

  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: orderDetailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['order-detail', selectedOrderId],
    queryFn: () => ordersApi.getById(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const selectedOrder = useMemo((): ClientOrder | null => {
    const o: Order | undefined = orderDetailData?.data;
    if (!o) return null;
    return {
      id: o.id,
      status: o.status,
      total_items: o.total_items,
      total_price: o.total_price,
      created_at: o.created_at,
      items: o.items ?? [],
    };
  }, [orderDetailData]);

  const {
    orders,
    total,
    isLoading,
    error,
    confirmReceived,
    cancelOrder,
    isConfirming,
    isCancelling,
  } = useClientOrders();

  const statusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: ords.status.pending,
    [OrderStatus.PROCESSING]: ords.status.processing,
    [OrderStatus.SHIPPED]: ords.status.shipped,
    [OrderStatus.RECEIVED]: ords.status.received,
    [OrderStatus.COMPLETED]: ords.status.completed,
    [OrderStatus.CANCELLED]: ords.status.cancelled,
  };

  async function handleConfirmReceived(orderId: number) {
    try {
      await confirmReceived(orderId);
      toast.success(ords.toast.confirmReceivedSuccess);
      setModalOpen(false);
    } catch {
      toast.error(ords.toast.confirmReceivedError);
    }
  }

  async function handleCancelOrder(orderId: number) {
    try {
      await cancelOrder(orderId);
      toast.success(ords.toast.cancelSuccess);
      setModalOpen(false);
    } catch {
      toast.error(ords.toast.cancelError);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[14px]">{ords.loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">{ords.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5.5">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-900">{ords.title}</h1>
          <p className="text-[14px] text-ink-500 mt-1">
            {total} {ords.count}
          </p>
        </div>
        <button
          onClick={() => router.push('/client/order')}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors shrink-0"
        >
          <Plus size={15} />
          {ords.newOrderBtn}
        </button>
      </div>

      <OrdersTableCard
        orders={orders}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        statusLabels={statusLabels}
        onView={(order) => {
          setSelectedOrderId(order.id);
          setModalOpen(true);
        }}
        onNewOrder={() => router.push('/client/order')}
        locale={locale}
        labels={{
          filter: ords.filter,
          table: ords.table,
          empty: ords.empty,
        }}
      />

      <OrderDetailModal
        order={selectedOrder}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locale={locale}
        isLoadingDetail={isLoadingDetail}
        onConfirmReceived={handleConfirmReceived}
        onCancelOrder={handleCancelOrder}
        isConfirming={isConfirming}
        isCancelling={isCancelling}
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
    </div>
  );
}
