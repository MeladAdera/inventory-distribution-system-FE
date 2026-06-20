'use client';

import { Download, Truck, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { ClientAvatar } from '@/features/clients/components/ClientAvatar';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { TransferStatus, NEXT_STATUS } from '../types/transfers.types';
import type { Transfer } from '../types/transfers.types';
import type { Shop } from '@/features/shops/types/shops.types';

const GRID = '1.1fr 1.6fr 1.8fr 0.8fr 1.3fr 1.2fr';
const HEADER_KEYS = ['date', 'shop', 'product', 'qty', 'status', 'actions'] as const;

type TransfersT = ReturnType<typeof useI18n>['t']['transfers'];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TransferStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  RECEIVED: 'bg-teal-50 text-teal-700 border-teal-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
};

function StatusBadge({ status, label }: { status: TransferStatus; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-medium',
        STATUS_STYLES[status]
      )}
    >
      {label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      className="grid gap-4 px-5 py-4 border-t border-border"
      style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: i === 0 ? '65%' : '55%' }}
        />
      ))}
    </div>
  );
}

// ── Pagination helpers ────────────────────────────────────────────────────────

function getPageNumbers(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', page - 1, page, page + 1, '…', total];
}

// ── Page button ───────────────────────────────────────────────────────────────

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-8 h-8 px-1 rounded-lg border text-[13px] font-mono transition-colors',
        active
          ? 'bg-ink-900 text-amber-500 border-ink-900'
          : 'bg-paper text-ink-700 border-border hover:bg-sand-100',
        disabled && 'opacity-40 pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  onAdd,
  p,
  canCreate,
}: {
  onAdd: () => void;
  p: TransfersT;
  canCreate: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-sand-100 border border-border flex items-center justify-center mb-4">
        <Truck size={24} className="text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">{p.emptyState.title}</p>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{p.emptyState.sub}</p>
      {canCreate && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Truck size={15} />
          {p.page.newTransfer}
        </button>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TransfersTableCardProps {
  transfers: Transfer[];
  total: number;
  shops: Shop[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  shopFilter: string;
  statusFilter: string;
  isAdmin: boolean;
  isUpdatingStatus: boolean;
  onShopChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onAddTransfer: () => void;
  onUpdateStatus: (id: number, status: TransferStatus) => void;
  onView: (transfer: Transfer) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransfersTableCard({
  transfers,
  total,
  shops,
  isLoading,
  page,
  pageSize,
  shopFilter,
  statusFilter,
  isAdmin,
  isUpdatingStatus,
  onShopChange,
  onStatusChange,
  onPageChange,
  onAddTransfer,
  onUpdateStatus,
  onView,
}: TransfersTableCardProps) {
  const { t } = useI18n();
  const p = t.transfers;

  const pageCount = Math.ceil(total / pageSize);
  const showPagination = pageCount > 1;
  const pages = getPageNumbers(page, pageCount);

  const selectCls =
    'h-9.5 border border-border rounded-lg bg-paper text-[13px] text-ink-800 px-3 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-50 cursor-pointer';

  const statusOptions = Object.values(TransferStatus);

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        {/* Shop filter */}
        <select
          value={shopFilter}
          onChange={(e) => onShopChange(e.target.value)}
          className={selectCls}
          style={{ width: 180 }}
        >
          <option value="">{p.toolbar.allShops}</option>
          {shops.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectCls}
          style={{ width: 160 }}
        >
          <option value="">{p.toolbar.allStatuses}</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {p.status[s]}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        <button className="inline-flex items-center gap-2 h-9.5 px-4 border border-border rounded-lg bg-paper text-[13px] text-ink-700 font-medium hover:bg-sand-100 transition-colors">
          <Download size={15} />
          {p.toolbar.export}
        </button>
      </div>

      {/* ── Table header (desktop) ────────────────────────────────── */}
      <div
        className="hidden md:grid items-center bg-sand-100 border-b border-border px-5 py-3"
        style={{ gridTemplateColumns: GRID }}
      >
        {HEADER_KEYS.map((key) => (
          <span key={key} className="text-xs font-medium text-ink-500">
            {p.table[key]}
          </span>
        ))}
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
      ) : transfers.length === 0 ? (
        <EmptyState onAdd={onAddTransfer} p={p} canCreate={!isAdmin} />
      ) : (
        transfers.map((transfer) => (
          <TransferRow
            key={transfer.id}
            transfer={transfer}
            shops={shops}
            isAdmin={isAdmin}
            isUpdatingStatus={isUpdatingStatus}
            onUpdateStatus={onUpdateStatus}
            onView={onView}
            p={p}
          />
        ))
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {!isLoading && showPagination && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <span className="text-[13px] text-ink-500">
            {p.pagination.showing
              .replace('{n}', String(transfers.length))
              .replace('{total}', String(total))}
          </span>
          <div className="flex items-center gap-1">
            <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft size={14} />
            </PageBtn>
            {pages.map((pg, i) =>
              pg === '…' ? (
                <span key={`ellipsis-${i}`} className="w-8 text-center text-[13px] text-ink-400">
                  …
                </span>
              ) : (
                <PageBtn key={pg} active={pg === page} onClick={() => onPageChange(pg as number)}>
                  {pg}
                </PageBtn>
              )
            )}
            <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>
              <ChevronRight size={14} />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

interface TransferRowProps {
  transfer: Transfer;
  shops: Shop[];
  isAdmin: boolean;
  isUpdatingStatus: boolean;
  onUpdateStatus: (id: number, status: TransferStatus) => void;
  onView: (transfer: Transfer) => void;
  p: TransfersT;
}

function TransferRow({
  transfer,
  shops,
  isAdmin,
  isUpdatingStatus,
  onUpdateStatus,
  onView,
  p,
}: TransferRowProps) {
  const shopName =
    transfer.to_shop_name ??
    shops.find((s) => s.id === transfer.to_shop_id)?.name ??
    `Shop #${transfer.to_shop_id}`;

  const firstItem = transfer.items?.[0];
  const productName = firstItem?.product_name ?? '—';
  const qty = firstItem?.quantity ?? transfer.total_items;

  const date = new Date(transfer.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const nextStatus = NEXT_STATUS[transfer.status];
  const actionLabel = getActionLabel(transfer.status, p);

  return (
    <div className="border-t border-border hover:bg-[#FCFAF6] transition-colors duration-120">
      {/* Desktop */}
      <div
        className="hidden md:grid items-center px-5 min-h-15 text-[13px] text-ink-800"
        style={{ gridTemplateColumns: GRID }}
      >
        {/* Date */}
        <span className="font-mono text-[12px] text-ink-600 whitespace-nowrap">{date}</span>

        {/* Shop */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ClientAvatar name={shopName} size={28} />
          <span className="font-medium text-ink-900 truncate">{shopName}</span>
        </div>

        {/* Product */}
        <div className="flex items-center gap-2.5 min-w-0">
          {firstItem ? (
            <>
              <ProductThumb id={firstItem.product_id} size={28} />
              <span className="text-ink-700 truncate">{productName}</span>
            </>
          ) : (
            <span className="text-ink-400 text-[12px]">
              {transfer.total_items} item{transfer.total_items !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Qty */}
        <span className="font-mono font-semibold text-ink-900">{qty}</span>

        {/* Status */}
        <StatusBadge status={transfer.status} label={p.status[transfer.status]} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(transfer)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-border text-[12px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
          >
            <Eye size={13} />
            {p.table.viewBtn}
          </button>
          {isAdmin && nextStatus ? (
            <button
              onClick={() => onUpdateStatus(transfer.id, nextStatus)}
              disabled={isUpdatingStatus}
              className="h-7 px-3 bg-ink-900 hover:bg-ink-800 text-white text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {actionLabel}
            </button>
          ) : isAdmin && transfer.status === 'SHIPPED' ? (
            <span className="text-[12px] text-ink-400 italic">{p.actions.awaitingReceipt}</span>
          ) : null}
        </div>
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClientAvatar name={shopName} size={34} />
            <div className="min-w-0">
              <p className="font-medium text-ink-900 text-sm truncate">{shopName}</p>
              <p className="font-mono text-xs text-ink-500 mt-0.5">{date}</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-ink-900 text-sm shrink-0">×{qty}</span>
        </div>

        {firstItem && (
          <div className="flex items-center gap-2 min-w-0">
            <ProductThumb id={firstItem.product_id} size={24} />
            <span className="text-[13px] text-ink-700 truncate">{productName}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StatusBadge status={transfer.status} label={p.status[transfer.status]} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(transfer)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-border text-[12px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
            >
              <Eye size={13} />
              {p.table.viewBtn}
            </button>
            {isAdmin && nextStatus && (
              <button
                onClick={() => onUpdateStatus(transfer.id, nextStatus)}
                disabled={isUpdatingStatus}
                className="h-7 px-3 bg-ink-900 hover:bg-ink-800 text-white text-[12px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getActionLabel(status: TransferStatus, p: TransfersT): string {
  switch (status) {
    case 'PENDING':
      return p.actions.process;
    case 'PROCESSING':
      return p.actions.ship;
    case 'RECEIVED':
      return p.actions.complete;
    default:
      return '';
  }
}
