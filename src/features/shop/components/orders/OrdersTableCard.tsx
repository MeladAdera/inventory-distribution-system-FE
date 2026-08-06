'use client';

import { Eye, ClipboardList, Search, X } from 'lucide-react';
import { FilterChips } from '@/common/components';
import { cn } from '@/common/utils/cn';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderView } from '../../types/clientOrders.types';
import type { ClientOrder } from '../../types/clientOrders.types';

function OrderNoChip({ id, large }: { id: number; large?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-lg bg-sand-100 border border-border font-mono font-bold text-ink-800 leading-none',
        large ? 'text-[15px]' : 'text-[13px]'
      )}
    >
      #{id}
    </span>
  );
}

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface OrdersTableLabels {
  searchPlaceholder: string;
  views: Record<'all' | 'inProgress' | 'done' | 'cancelled', string>;
  footer: string;
  clearFilters: string;
  awaitingHint: string;
  table: {
    orderNo: string;
    date: string;
    items: string;
    total: string;
    status: string;
    details: string;
    viewBtn: string;
    itemsUnit: string;
  };
  empty: { title: string; action: string };
  emptyFiltered: { title: string; sub: string };
}

interface OrdersTableCardProps {
  /** Already narrowed by search and the view chips. */
  orders: ClientOrder[];
  /** Every order the shop has placed — for the footer. */
  total: number;
  search: string;
  view: OrderView;
  hasFilters: boolean;
  statusLabels: Record<OrderStatus, string>;
  onSearchChange: (v: string) => void;
  onViewChange: (v: OrderView) => void;
  onClearFilters: () => void;
  onView: (order: ClientOrder) => void;
  onNewOrder: () => void;
  locale: 'ar' | 'en';
  labels: OrdersTableLabels;
}

const VIEW_ORDER: { value: OrderView; key: 'all' | 'inProgress' | 'done' | 'cancelled' }[] = [
  { value: OrderView.ALL, key: 'all' },
  { value: OrderView.IN_PROGRESS, key: 'inProgress' },
  { value: OrderView.DONE, key: 'done' },
  { value: OrderView.CANCELLED, key: 'cancelled' },
];

function ViewButton({
  onClick,
  label,
  variant,
}: {
  onClick: () => void;
  label: string;
  variant: 'outline' | 'solid';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer',
        variant === 'outline'
          ? 'px-3 h-8 border border-border text-ink-700 hover:bg-sand-100'
          : 'px-4 h-9 bg-ink-900 text-amber-500 font-semibold hover:bg-ink-800'
      )}
    >
      <Eye size={14} />
      {label}
    </button>
  );
}

export function OrdersTableCard({
  orders,
  total,
  search,
  view,
  hasFilters,
  statusLabels,
  onSearchChange,
  onViewChange,
  onClearFilters,
  onView,
  onNewOrder,
  locale,
  labels,
}: OrdersTableCardProps) {
  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-5 py-3.5 border-b border-border">
        <div className="relative flex-1 min-w-50 order-1">
          <Search
            size={15}
            className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full h-9 ps-9 pe-3 border border-border rounded-lg text-[13px] text-ink-800 placeholder:text-ink-400 bg-paper outline-none focus:border-amber-500"
          />
        </div>

        <div className="order-2 w-full sm:w-auto">
          <FilterChips
            value={view}
            onChange={onViewChange}
            options={VIEW_ORDER.map((o) => ({ value: o.value, label: labels.views[o.key] }))}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-sand-100 flex items-center justify-center">
            <ClipboardList size={26} className="text-ink-400" />
          </div>
          <p className="text-[15px] font-medium text-ink-700">
            {hasFilters ? labels.emptyFiltered.title : labels.empty.title}
          </p>
          {hasFilters ? (
            <>
              <p className="text-[13px] text-ink-500 max-w-70">{labels.emptyFiltered.sub}</p>
              <button
                onClick={onClearFilters}
                className="mt-1 flex items-center gap-1.5 px-4 h-9 rounded-lg border border-border text-[13px] font-medium text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
              >
                <X size={14} />
                {labels.clearFilters}
              </button>
            </>
          ) : (
            <button
              onClick={onNewOrder}
              className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors cursor-pointer"
            >
              {labels.empty.action}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[auto_1fr_0.7fr_0.8fr_1.3fr_auto] items-center gap-4 bg-sand-100 border-b border-border px-6 py-3">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20">
                {labels.table.orderNo}
              </span>
              {[labels.table.date, labels.table.items, labels.table.total, labels.table.status].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[11px] font-semibold tracking-wider uppercase text-ink-400"
                  >
                    {h}
                  </span>
                )
              )}
              <span className="text-[11px] font-semibold tracking-wider uppercase text-ink-400 w-20 text-center">
                {labels.table.details}
              </span>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => onView(order)}
                className="grid grid-cols-[auto_1fr_0.7fr_0.8fr_1.3fr_auto] items-center gap-4 px-6 py-3.5 border-b border-border last:border-b-0 hover:bg-page transition-colors cursor-pointer"
              >
                <span className="w-20">
                  <OrderNoChip id={order.id} />
                </span>

                <span className="text-[13px] text-ink-600">
                  {formatDate(order.created_at, locale)}
                </span>

                <span className="text-[13px] text-ink-600">
                  {order.total_items} {labels.table.itemsUnit}
                </span>

                <span className="font-mono text-[13px] text-ink-700 tabular-nums">
                  {order.total_price != null ? order.total_price.toFixed(2) : '—'}
                </span>

                <span className="min-w-0">
                  <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                  {/* Shipped is the one status that needs the shop to do
                      something — the stock only lands once they confirm. */}
                  {order.status === OrderStatus.SHIPPED && (
                    <span className="block mt-1 text-[11px] text-amber-700">
                      {labels.awaitingHint}
                    </span>
                  )}
                </span>

                <div className="w-20 flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <ViewButton
                    onClick={() => onView(order)}
                    label={labels.table.viewBtn}
                    variant="outline"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2.5 px-3 py-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => onView(order)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-paper"
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <span className="flex items-center gap-2 flex-wrap">
                    <OrderNoChip id={order.id} large />
                    <span className="text-[13px] text-ink-600">
                      {order.total_items} {labels.table.itemsUnit}
                    </span>
                    {order.total_price != null && (
                      <span className="font-mono text-[13px] text-ink-700 tabular-nums">
                        {order.total_price.toFixed(2)}
                      </span>
                    )}
                  </span>

                  <span className="text-[12px] text-ink-500">
                    {formatDate(order.created_at, locale)}
                  </span>

                  <span>
                    <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                  </span>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <ViewButton
                    onClick={() => onView(order)}
                    label={labels.table.viewBtn}
                    variant="solid"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 sm:px-6 py-3 border-t border-border bg-page">
            <p className="text-[12px] text-ink-400">
              {labels.footer
                .replace('{shown}', String(orders.length))
                .replace('{total}', String(total))}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
