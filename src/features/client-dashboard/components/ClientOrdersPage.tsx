'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ClipboardList, Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { Modal } from '@/common/components/Modal';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { CLIENT_ORDERS } from '../mock/clientOrders';
import type { ClientOrder, OrderStatus } from '../mock/clientOrders';

type StatusFilter = 'all' | OrderStatus;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

// ── Order Status Badge ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  processing: { bg: 'bg-warning-100', text: 'text-warning-700', dot: 'bg-warning-700' },
  shipped: { bg: 'bg-info-100', text: 'text-info-700', dot: 'bg-info-700' },
  received: { bg: 'bg-success-100', text: 'text-success-700', dot: 'bg-success-700' },
};

function OrderStatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-[12px] font-medium whitespace-nowrap',
        s.bg,
        s.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', s.dot)} />
      {label}
    </span>
  );
}

// ── Order Detail Modal ─────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  open,
  onClose,
  locale,
  labels,
}: {
  order: ClientOrder | null;
  open: boolean;
  onClose: () => void;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    productsLabel: string;
    requestedQty: string;
    notesLabel: string;
    closeBtn: string;
    statusLabels: Record<OrderStatus, string>;
  };
}) {
  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="lg">
      {/* Section 1 — Order meta */}
      <div className="flex items-center gap-4 mb-5">
        <OrderStatusBadge status={order.status} label={labels.statusLabels[order.status]} />
        <div>
          <p className="text-[16px] font-semibold text-ink-900">#{order.id}</p>
          <p className="text-[13px] text-ink-500 mt-0.5">{formatDate(order.date, locale)}</p>
        </div>
      </div>

      {/* Section 2 — Requested products */}
      <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400 mb-3">
        {labels.productsLabel}
      </p>
      <div className="border border-border rounded-[10px] overflow-hidden mb-5">
        {order.items.map((item, i) => {
          const name = locale === 'ar' ? item.nameAr : item.nameEn;
          return (
            <div
              key={item.productId}
              className={cn(
                'flex items-center justify-between px-4 py-3',
                i > 0 && 'border-t border-border'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductThumb id={item.productId} size={28} />
                <span className="text-[13px] font-medium text-ink-800 truncate">{name}</span>
              </div>
              <div className="text-end shrink-0 ms-4">
                <p className="text-[12px] text-ink-400">{labels.requestedQty}</p>
                <p className="font-mono text-[14px] font-semibold text-ink-900">{item.qty}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 3 — Notes */}
      {order.notes && (
        <div className="mb-5">
          <p className="text-[12px] font-medium text-ink-500 mb-1">{labels.notesLabel}</p>
          <p className="text-[14px] text-ink-700">{order.notes}</p>
        </div>
      )}

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

// ── Page ──────────────────────────────────────────────────────────────────

export function ClientOrdersPage() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const ords = t.client.orders;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const statusLabels: Record<OrderStatus, string> = {
    processing: ords.status.processing,
    shipped: ords.status.shipped,
    received: ords.status.received,
  };

  const filtered =
    statusFilter === 'all' ? CLIENT_ORDERS : CLIENT_ORDERS.filter((o) => o.status === statusFilter);

  function handleView(order: ClientOrder) {
    setSelectedOrder(order);
    setModalOpen(true);
  }

  return (
    <div className="max-w-330 mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-5.5">
        <div>
          <h1 className="text-[26px] font-semibold text-ink-900">{ords.title}</h1>
          <p className="text-[14px] text-ink-500 mt-1">
            {CLIENT_ORDERS.length} {ords.count}
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

      {/* ── Table Card ── */}
      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 w-[180px] px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">{ords.filter.all}</option>
            <option value="processing">{ords.filter.processing}</option>
            <option value="shipped">{ords.filter.shipped}</option>
            <option value="received">{ords.filter.received}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <ClipboardList size={32} className="text-ink-400" />
            <p className="text-[15px] font-medium text-ink-700">{ords.empty.title}</p>
            <button
              onClick={() => router.push('/client/order')}
              className="mt-1 flex items-center gap-2 px-4 h-9 rounded-lg bg-amber-600 text-white text-[13px] font-semibold hover:bg-amber-700 transition-colors"
            >
              {ords.empty.action}
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="hidden sm:block">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] bg-sand-100 px-5 py-2.5 text-[12px] font-medium text-ink-500">
                <span>{ords.table.orderNo}</span>
                <span>{ords.table.date}</span>
                <span>{ords.table.items}</span>
                <span>{ords.table.status}</span>
                <span>{ords.table.details}</span>
              </div>

              {/* Table rows */}
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] items-center px-5 py-2 min-h-[60px] border-t border-border hover:bg-sand-50 transition-colors"
                >
                  <span className="font-mono text-[13px] font-semibold text-ink-900">
                    #{order.id}
                  </span>
                  <span className="text-[13px] text-ink-600">{formatDate(order.date, locale)}</span>
                  <span className="font-mono text-[13px] text-ink-700">
                    {order.items.length} {ords.table.itemsUnit}
                  </span>
                  <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                  <button
                    onClick={() => handleView(order)}
                    className="flex items-center gap-1.5 w-fit px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                  >
                    <Eye size={14} />
                    {ords.table.viewBtn}
                  </button>
                </div>
              ))}
            </div>

            {/* ── Mobile Cards ── */}
            <div className="sm:hidden flex flex-col divide-y divide-border">
              {filtered.map((order) => (
                <div key={order.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[14px] font-semibold text-ink-900">
                      #{order.id}
                    </span>
                    <OrderStatusBadge status={order.status} label={statusLabels[order.status]} />
                  </div>
                  <p className="text-[13px] text-ink-500">{formatDate(order.date, locale)}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[13px] text-ink-600">
                      {order.items.length} {ords.table.itemsUnit}
                    </span>
                    <button
                      onClick={() => handleView(order)}
                      className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border text-[13px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
                    >
                      <Eye size={14} />
                      {ords.table.viewBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      <OrderDetailModal
        order={selectedOrder}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locale={locale}
        labels={{
          title: ords.modal.title,
          productsLabel: ords.modal.productsLabel,
          requestedQty: ords.modal.requestedQty,
          notesLabel: ords.modal.notesLabel,
          closeBtn: ords.modal.closeBtn,
          statusLabels,
        }}
      />
    </div>
  );
}
