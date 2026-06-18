import { Eye, ClipboardList } from 'lucide-react';
import { OrderStatus } from '@/features/orders/types/orders.types';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { ClientOrder, ClientStatusFilter } from '../../types/clientOrders.types';

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

interface OrdersTableCardProps {
  orders: ClientOrder[];
  statusFilter: ClientStatusFilter;
  onFilterChange: (value: ClientStatusFilter) => void;
  statusLabels: Record<OrderStatus, string>;
  onView: (order: ClientOrder) => void;
  onNewOrder: () => void;
  locale: 'ar' | 'en';
  labels: {
    filter: {
      all: string;
      pending: string;
      processing: string;
      shipped: string;
      received: string;
      completed: string;
      cancelled: string;
    };
    table: {
      orderNo: string;
      date: string;
      items: string;
      status: string;
      details: string;
      viewBtn: string;
      itemsUnit: string;
    };
    empty: {
      title: string;
      action: string;
    };
  };
}

export function OrdersTableCard({
  orders,
  statusFilter,
  onFilterChange,
  statusLabels,
  onView,
  onNewOrder,
  locale,
  labels,
}: OrdersTableCardProps) {
  const filtered =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
        <select
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value as ClientStatusFilter)}
          className="h-9 w-45 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="ALL">{labels.filter.all}</option>
          <option value={OrderStatus.PENDING}>{labels.filter.pending}</option>
          <option value={OrderStatus.PROCESSING}>{labels.filter.processing}</option>
          <option value={OrderStatus.SHIPPED}>{labels.filter.shipped}</option>
          <option value={OrderStatus.RECEIVED}>{labels.filter.received}</option>
          <option value={OrderStatus.COMPLETED}>{labels.filter.completed}</option>
          <option value={OrderStatus.CANCELLED}>{labels.filter.cancelled}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <ClipboardList size={32} className="text-ink-400" />
          <p className="text-[15px] font-medium text-ink-700">{labels.empty.title}</p>
          <button
            onClick={onNewOrder}
            className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors"
          >
            {labels.empty.action}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] bg-sand-100 px-5 py-2.5 text-[12px] font-medium text-ink-500">
              <span>{labels.table.orderNo}</span>
              <span>{labels.table.date}</span>
              <span>{labels.table.items}</span>
              <span>{labels.table.status}</span>
              <span>{labels.table.details}</span>
            </div>

            {filtered.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] items-center px-5 py-2 min-h-15 border-t border-border hover:bg-sand-50 transition-colors"
              >
                <span className="font-mono text-[13px] font-semibold text-ink-900">
                  #{order.id}
                </span>
                <span className="text-[13px] text-ink-600">
                  {formatDate(order.created_at, locale)}
                </span>
                <span className="font-mono text-[13px] text-ink-700">
                  {order.total_items} {labels.table.itemsUnit}
                </span>
                <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                <button
                  onClick={() => onView(order)}
                  className="flex items-center gap-1.5 w-fit px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                >
                  <Eye size={14} />
                  {labels.table.viewBtn}
                </button>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {filtered.map((order) => (
              <div key={order.id} className="px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[14px] font-semibold text-ink-900">
                    #{order.id}
                  </span>
                  <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                </div>
                <p className="text-[13px] text-ink-500">{formatDate(order.created_at, locale)}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] text-ink-600">
                    {order.total_items} {labels.table.itemsUnit}
                  </span>
                  <button
                    onClick={() => onView(order)}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                  >
                    <Eye size={14} />
                    {labels.table.viewBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
