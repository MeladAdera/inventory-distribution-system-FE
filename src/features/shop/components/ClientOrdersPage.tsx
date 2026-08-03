'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, AlertTriangle, Download } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { StatCard, StatCardGrid } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { useClientOrders, useClientOrderDetail } from '../hooks/useClientOrders';
import { OrdersTableCard } from './orders/OrdersTableCard';
import { OrderDetailModal } from './orders/OrderDetailModal';
import { OrderView, ORDER_VIEW_STATUSES } from '../types/clientOrders.types';

export function ClientOrdersPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const ords = t.client.orders;

  const [view, setView] = useState<OrderView>(OrderView.ALL);
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { order: selectedOrder, isLoading: isLoadingDetail } =
    useClientOrderDetail(selectedOrderId);

  const {
    orders,
    stats,
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

  // Every order is already loaded in one request, so both filters run over the
  // whole history rather than over a page of it.
  const visibleOrders = useMemo(() => {
    const query = search.trim().replace('#', '');
    return orders.filter((order) => {
      if (view !== OrderView.ALL && !ORDER_VIEW_STATUSES[view].includes(order.status)) return false;
      return query === '' || String(order.id).includes(query);
    });
  }, [orders, view, search]);

  const hasFilters = search.trim() !== '' || view !== OrderView.ALL;

  function clearFilters() {
    setSearch('');
    setView(OrderView.ALL);
  }

  async function handleConfirmReceived(orderId: number) {
    try {
      await confirmReceived(orderId);
      toast.success(ords.toast.confirmReceivedSuccess);
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleCancelOrder(orderId: number) {
    try {
      await cancelOrder(orderId);
      toast.success(ords.toast.cancelSuccess);
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  /** Exports the rows currently in view — what the toolbar says is on screen. */
  function handleExport() {
    if (visibleOrders.length === 0) {
      toast.error(ords.export.empty);
      return;
    }
    downloadCsv(
      dateStampedName('orders'),
      [ords.table.orderNo, ords.table.date, ords.table.items, ords.table.total, ords.table.status],
      visibleOrders.map((order) => [
        order.id,
        order.created_at,
        order.total_items,
        order.total_price != null ? order.total_price.toFixed(2) : '',
        statusLabels[order.status],
      ])
    );
    toast.success(ords.export.done.replace('{n}', String(visibleOrders.length)));
  }

  const lastOrderLabel = stats.lastOrderAt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(stats.lastOrderAt))
    : '—';

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
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{ords.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wider uppercase text-amber-700 truncate">
            {ords.eyebrow}
          </p>
          <h1 className="text-[26px] font-semibold text-ink-900">{ords.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg border border-border bg-paper text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">{ords.export.btn}</span>
          </button>
          <button
            onClick={() => router.push('/client/order')}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{ords.newOrderBtn}</span>
          </button>
        </div>
      </div>

      <div className="mb-5">
        <StatCardGrid>
          <StatCard label={ords.stats.total} value={String(total || stats.total)} />
          <StatCard
            label={ords.stats.inProgress}
            value={String(stats.inProgress)}
            tone={stats.inProgress > 0 ? 'amber' : 'neutral'}
            onClick={() => setView(OrderView.IN_PROGRESS)}
          />
          <StatCard
            label={ords.stats.awaiting}
            value={String(stats.awaitingConfirmation)}
            tone={stats.awaitingConfirmation > 0 ? 'success' : 'neutral'}
            onClick={() => setView(OrderView.IN_PROGRESS)}
          />
          <StatCard label={ords.stats.lastOrder} value={lastOrderLabel} variant="text" />
        </StatCardGrid>
      </div>

      <OrdersTableCard
        orders={visibleOrders}
        total={total || orders.length}
        search={search}
        view={view}
        hasFilters={hasFilters}
        statusLabels={statusLabels}
        onSearchChange={setSearch}
        onViewChange={setView}
        onClearFilters={clearFilters}
        onView={(order) => {
          setSelectedOrderId(order.id);
          setModalOpen(true);
        }}
        onNewOrder={() => router.push('/client/order')}
        locale={locale}
        labels={{
          searchPlaceholder: ords.searchPlaceholder,
          views: ords.views,
          footer: ords.footer,
          clearFilters: ords.clearFilters,
          awaitingHint: ords.awaitingHint,
          table: ords.table,
          empty: ords.empty,
          emptyFiltered: ords.emptyFiltered,
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
