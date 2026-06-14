'use client';

import { Download, Truck, PartyPopper } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { cn } from '@/common/utils/cn';
import { ClientAvatar } from '@/features/clients/components/ClientAvatar';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import type { Shortage, ShortageClient, ShortageStatus } from '../types/shortages.types';

const GRID = '1.6fr 1.8fr 1fr 1fr 1.1fr 1.1fr 130px';
const HEADER_KEYS = [
  'client',
  'product',
  'remaining',
  'minLevel',
  'status',
  'suggested',
  'actions',
] as const;

type ShortagesT = ReturnType<typeof useI18n>['t']['shortages'];

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
          style={{ width: i === 0 ? '65%' : '50%' }}
        />
      ))}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────

function ShortageStatusBadge({ status, label }: { status: ShortageStatus; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
        status === 'out' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          status === 'out' ? 'bg-danger-700' : 'bg-warning-700'
        )}
      />
      {label}
    </span>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ p }: { p: ShortagesT }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-[14px] bg-sand-100 border border-border flex items-center justify-center mb-4">
        <PartyPopper size={24} className="text-ink-400" />
      </div>
      <p className="text-base font-semibold text-ink-900">{p.emptyState.title}</p>
      <p className="mt-1.5 text-sm text-ink-500 max-w-xs">{p.emptyState.sub}</p>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ShortagesTableCardProps {
  shortages: Shortage[];
  isLoading: boolean;
  clientFilter: string;
  statusFilter: string;
  clients: ShortageClient[];
  onClientChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onReplenish: (s: Shortage) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ShortagesTableCard({
  shortages,
  isLoading,
  clientFilter,
  statusFilter,
  clients,
  onClientChange,
  onStatusChange,
  onReplenish,
}: ShortagesTableCardProps) {
  const { t, locale } = useI18n();
  const p = t.shortages;

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

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectCls}
          style={{ width: 160 }}
        >
          <option value="">{p.toolbar.allStatuses}</option>
          <option value="low">{p.toolbar.statusLow}</option>
          <option value="out">{p.toolbar.statusOut}</option>
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
        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
      ) : shortages.length === 0 ? (
        <EmptyState p={p} />
      ) : (
        shortages.map((shortage) => (
          <ShortageRow
            key={shortage.id}
            shortage={shortage}
            locale={locale}
            p={p}
            onReplenish={onReplenish}
          />
        ))
      )}
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────

interface ShortageRowProps {
  shortage: Shortage;
  locale: string;
  p: ShortagesT;
  onReplenish: (s: Shortage) => void;
}

function ShortageRow({ shortage, locale, p, onReplenish }: ShortageRowProps) {
  const clientName = locale === 'ar' ? shortage.client_name_ar : shortage.client_name_en;
  const productName = locale === 'ar' ? shortage.product_name_ar : shortage.product_name_en;
  const statusLabel = p.status[shortage.status];

  const remainingCls = cn(
    'font-mono font-semibold',
    shortage.status === 'out' ? 'text-danger-700' : 'text-warning-700'
  );

  const replenishBtn = (
    <button
      onClick={() => onReplenish(shortage)}
      className="inline-flex items-center gap-1.5 h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-medium rounded-lg transition-colors shrink-0"
    >
      <Truck size={13} />
      {p.replenish}
    </button>
  );

  return (
    <div className="border-t border-border hover:bg-[#FCFAF6] transition-colors duration-120">
      {/* Desktop grid row */}
      <div
        className="hidden md:grid items-center px-5 min-h-15 text-[13px] text-ink-800"
        style={{ gridTemplateColumns: GRID }}
      >
        {/* Client */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ClientAvatar name={clientName} size={28} />
          <span className="font-medium text-ink-900 truncate">{clientName}</span>
        </div>

        {/* Product */}
        <div className="flex items-center gap-2.5 min-w-0">
          <ProductThumb id={shortage.product_id} size={28} />
          <span className="text-ink-700 truncate">{productName}</span>
        </div>

        {/* Remaining */}
        <span className={remainingCls}>{shortage.remaining}</span>

        {/* Min level */}
        <span className="font-mono text-ink-500">{shortage.min_level}</span>

        {/* Status */}
        <ShortageStatusBadge status={shortage.status} label={statusLabel} />

        {/* Suggested */}
        <span className="font-mono font-medium text-ink-800">+{shortage.suggested}</span>

        {/* Actions */}
        <div className="flex justify-end">{replenishBtn}</div>
      </div>

      {/* Mobile card */}
      <div className="md:hidden p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ClientAvatar name={clientName} size={34} />
            <div className="min-w-0">
              <p className="font-medium text-ink-900 text-sm truncate">{clientName}</p>
              <ShortageStatusBadge status={shortage.status} label={statusLabel} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <ProductThumb id={shortage.product_id} size={24} />
          <span className="text-[13px] text-ink-700 truncate">{productName}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <span className="text-ink-500">
            {p.table.remaining}: <span className={remainingCls}>{shortage.remaining}</span>
          </span>
          <span className="text-ink-500">
            {p.table.minLevel}: <span className="font-mono text-ink-500">{shortage.min_level}</span>
          </span>
          <span className="text-ink-500">
            {p.table.suggested}:{' '}
            <span className="font-mono font-medium text-ink-800">+{shortage.suggested}</span>
          </span>
        </div>
        <div className="w-full">{replenishBtn}</div>
      </div>
    </div>
  );
}
