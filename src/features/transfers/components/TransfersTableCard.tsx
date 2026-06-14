'use client';

import { Download, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { ClientAvatar } from '@/features/clients/components/ClientAvatar';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import type { Transfer } from '../types/transfers.types';
import type { TransferClient, TransferProduct } from '../types/transfers.types';

const GRID = '1.1fr 1.6fr 1.8fr 1fr 1.4fr 1.2fr';
const HEADER_KEYS = ['date', 'client', 'product', 'qty', 'notes', 'recordedBy'] as const;

type TransfersT = ReturnType<typeof useI18n>['t']['transfers'];

// ── Skeleton ───────────────────────────────────────────────────────────────

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

// ── Pagination helpers ─────────────────────────────────────────────────────

function getPageNumbers(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', page - 1, page, page + 1, '…', total];
}

// ── Page button ────────────────────────────────────────────────────────────

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

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onAdd, p }: { onAdd: () => void; p: TransfersT }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-sand-100 border border-border flex items-center justify-center mb-4">
        <Truck size={24} className="text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">{p.emptyState.title}</p>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{p.emptyState.sub}</p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Truck size={15} />
        {p.page.newTransfer}
      </button>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface TransfersTableCardProps {
  transfers: Transfer[];
  filteredCount: number;
  isLoading: boolean;
  page: number;
  pageSize: number;
  clientFilter: string;
  productFilter: string;
  clients: TransferClient[];
  products: TransferProduct[];
  onClientChange: (v: string) => void;
  onProductChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onAddTransfer: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function TransfersTableCard({
  transfers,
  filteredCount,
  isLoading,
  page,
  pageSize,
  clientFilter,
  productFilter,
  clients,
  products,
  onClientChange,
  onProductChange,
  onPageChange,
  onAddTransfer,
}: TransfersTableCardProps) {
  const { t, locale } = useI18n();
  const p = t.transfers;

  const pageCount = Math.ceil(filteredCount / pageSize);
  const showPagination = pageCount > 1;
  const pages = getPageNumbers(page, pageCount);

  const selectCls =
    'h-9.5 border border-border rounded-lg bg-paper text-[13px] text-ink-800 px-3 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-50 cursor-pointer';

  return (
    <div className="bg-paper border border-border rounded-xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-border">
        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={(e) => onClientChange(e.target.value)}
          className={selectCls}
          style={{ width: 180 }}
        >
          <option value="">{p.toolbar.allClients}</option>
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {locale === 'ar' ? c.name_ar : c.name_en}
            </option>
          ))}
        </select>

        {/* Product filter */}
        <select
          value={productFilter}
          onChange={(e) => onProductChange(e.target.value)}
          className={selectCls}
          style={{ width: 180 }}
        >
          <option value="">{p.toolbar.allProducts}</option>
          {products.map((prod) => (
            <option key={prod.id} value={String(prod.id)}>
              {locale === 'ar' ? prod.name_ar : prod.name_en}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export */}
        <button className="inline-flex items-center gap-2 h-9.5 px-4 border border-border rounded-lg bg-paper text-[13px] text-ink-700 font-medium hover:bg-sand-100 transition-colors">
          <Download size={15} />
          {p.toolbar.export}
        </button>
      </div>

      {/* ── Table header (desktop only) ──────────────────────────── */}
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

      {/* ── Body ────────────────────────────────────────────────────── */}
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
      ) : transfers.length === 0 ? (
        <EmptyState onAdd={onAddTransfer} p={p} />
      ) : (
        transfers.map((transfer) => (
          <TransferRow key={transfer.id} transfer={transfer} locale={locale} p={p} />
        ))
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {!isLoading && showPagination && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <span className="text-[13px] text-ink-500">
            {p.pagination.showing
              .replace('{n}', String(transfers.length))
              .replace('{total}', String(filteredCount))}
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

// ── Table row ──────────────────────────────────────────────────────────────

interface TransferRowProps {
  transfer: Transfer;
  locale: string;
  p: TransfersT;
}

function TransferRow({ transfer, locale, p }: TransferRowProps) {
  const clientName = locale === 'ar' ? transfer.client_name_ar : transfer.client_name_en;
  const productName = locale === 'ar' ? transfer.product_name_ar : transfer.product_name_en;
  const date = locale === 'ar' ? transfer.date_ar : transfer.date_en;
  const notes = locale === 'ar' ? transfer.notes_ar : transfer.notes_en;
  const recordedBy = locale === 'ar' ? transfer.recorded_by_ar : transfer.recorded_by_en;

  return (
    <div className="border-t border-border hover:bg-[#FCFAF6] transition-colors duration-120">
      {/* Desktop grid row */}
      <div
        className="hidden md:grid items-center px-5 min-h-15 text-[13px] text-ink-800"
        style={{ gridTemplateColumns: GRID }}
      >
        {/* Date */}
        <span className="font-mono text-[12px] text-ink-600 whitespace-nowrap">{date}</span>

        {/* Client */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ClientAvatar name={clientName} size={28} />
          <span className="font-medium text-ink-900 truncate">{clientName}</span>
        </div>

        {/* Product */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ProductThumb id={transfer.product_id} size={28} />
          <span className="text-ink-700 truncate">{productName}</span>
        </div>

        {/* Qty */}
        <span className="font-mono font-semibold text-ink-900">{transfer.qty}</span>

        {/* Notes */}
        <span className="text-[13px] text-ink-500 truncate">{notes || '—'}</span>

        {/* Recorded by */}
        <span className="text-[13px] text-ink-600">{recordedBy}</span>
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClientAvatar name={clientName} size={34} />
            <div className="min-w-0">
              <p className="font-medium text-ink-900 text-sm truncate">{clientName}</p>
              <p className="font-mono text-xs text-ink-500 mt-0.5">{date}</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-ink-900 text-sm shrink-0">
            ×{transfer.qty}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <ProductThumb id={transfer.product_id} size={24} />
          <span className="text-[13px] text-ink-700 truncate">{productName}</span>
        </div>
        {notes && <p className="text-xs text-ink-500">{notes}</p>}
        <p className="text-xs text-ink-400">
          {p.table.recordedBy}: {recordedBy}
        </p>
      </div>
    </div>
  );
}
