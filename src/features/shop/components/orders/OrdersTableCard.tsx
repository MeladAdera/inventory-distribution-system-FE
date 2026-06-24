import { Eye, ClipboardList } from 'lucide-react';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { ClientOrder, ClientStatusFilter } from '../../types/clientOrders.types';

function OrderIdChip({ id }: { id: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-sand-100 border border-border">
      <span className="font-mono text-[13px] font-bold text-ink-800">{id}</span>
    </span>
  );
}

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
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_0.7fr_1.3fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20">
                {labels.table.orderNo}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.date}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.items}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">
                {labels.table.status}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-16 text-center">
                {labels.table.details}
              </span>
            </div>

            {filtered.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[auto_1fr_0.7fr_1.3fr_auto] items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-sand-50 transition-colors"
              >
                <div className="w-20">
                  <OrderIdChip id={order.id} />
                </div>
                <span className="text-[13px] text-ink-600">
                  {formatDate(order.created_at, locale)}
                </span>
                <span className="text-[13px] text-ink-600">
                  {order.total_items} {labels.table.itemsUnit}
                </span>
                <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                <div className="w-16 flex justify-center">
                  <button
                    onClick={() => onView(order)}
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors whitespace-nowrap"
                  >
                    <Eye size={14} />
                    {labels.table.viewBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-border">
            {filtered.map((order) => (
              <div key={order.id} className="px-5 py-4 flex flex-col gap-3">
                {/* Row 1: big order number + view button */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[18px] font-bold text-ink-900 leading-none px-2 py-1 rounded-lg bg-sand-100 border border-border">
                    {order.id}
                  </span>
                  <button
                    onClick={() => onView(order)}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-ink-900 text-amber-500 text-[13px] font-semibold hover:bg-ink-800 transition-colors shrink-0"
                  >
                    <Eye size={14} />
                    {labels.table.viewBtn}
                  </button>
                </div>

                {/* Row 2: date · items */}
                <p className="text-[13px] text-ink-500">
                  {formatDate(order.created_at, locale)}
                  <span className="mx-2 text-ink-300">·</span>
                  {order.total_items} {labels.table.itemsUnit}
                </p>

                {/* Row 3: status badge */}
                <div>
                  <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
