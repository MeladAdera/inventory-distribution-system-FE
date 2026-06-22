'use client';

import { useRouter } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  Clock,
  PackageCheck,
  ShoppingCart,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { CardShell } from '@/features/dashboard/components/CardShell';
import { ProductThumb } from '@/features/products/components/ProductThumb';
import { StockStatus } from '@/features/products/types/products.types';
import { useClientInventory } from '../hooks/useClientInventory';
import { useClientOrders } from '../hooks/useClientOrders';
import type { EnrichedInventoryItem } from '../types/clientInventory.types';

// ── Stock status badge ─────────────────────────────────────────────────────

function StockBadge({
  status,
  labels,
}: {
  status: StockStatus;
  labels: { low: string; out: string };
}) {
  const isOut = status === StockStatus.OUT_OF_STOCK;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full text-xs font-medium whitespace-nowrap',
        isOut ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          isOut ? 'bg-danger-700' : 'bg-warning-700'
        )}
      />
      {isOut ? labels.out : labels.low}
    </span>
  );
}

// ── Low stock item row ─────────────────────────────────────────────────────

interface LowStockItemProps {
  item: EnrichedInventoryItem;
  labels: {
    current: string;
    min: string;
    orderMore: string;
    statusLow: string;
    statusOut: string;
  };
  onOrderMore: (productId: number) => void;
}

function LowStockItem({ item, labels, onOrderMore }: LowStockItemProps) {
  return (
    <div className="bg-paper border border-border rounded-xl px-5 py-4 flex items-center gap-3.5">
      <ProductThumb id={item.product_id} size={38} imageUrl={item.image_url} />

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ink-900 truncate">{item.product_name}</p>
        <p className="text-[13px] text-ink-500 mt-0.5">
          {labels.current}: {item.current_quantity}&nbsp;&nbsp;|&nbsp;&nbsp;{labels.min}:{' '}
          {item.low_stock_threshold}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <StockBadge
          status={item.status}
          labels={{ low: labels.statusLow, out: labels.statusOut }}
        />
        <button
          onClick={() => onOrderMore(item.product_id)}
          className="flex items-center gap-1.5 px-3 py-1.75 rounded-lg border border-amber-600 bg-amber-50 text-amber-700 text-[13px] font-semibold hover:bg-amber-100 transition-colors"
        >
          <ShoppingCart size={13} />
          {labels.orderMore}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ClientDashboardPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const d = t.client.dashboard;
  const kpi = d.kpi;
  const ls = d.lowStock;

  const { allItems, isLoading: isLoadingInv, error: invError } = useClientInventory();
  const { orders, isLoading: isLoadingOrders } = useClientOrders();

  const lowStockItems = allItems.filter(
    (i) => i.status === StockStatus.LOW_STOCK || i.status === StockStatus.OUT_OF_STOCK
  );

  const lastOrder = orders[0] ?? null;
  const lastOrderValue = lastOrder
    ? new Date(lastOrder.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : '—';
  const lastOrderSub = lastOrder ? `#${lastOrder.id}` : kpi.lastOrderSub;

  function handleOrderMore(productId: number) {
    router.push(`/client/order?product=${productId}`);
  }

  if (isLoadingInv || isLoadingOrders) {
    return (
      <div className="max-w-330 mx-auto flex items-center justify-center py-24">
        <Loader2 size={28} className="text-ink-400 animate-spin" />
      </div>
    );
  }

  if (invError) {
    return (
      <div className="max-w-330 mx-auto flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle size={28} className="text-danger-500" />
        <p className="text-[14px] text-ink-600">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-330 mx-auto px-0 space-y-0">
      {/* ── Layer 1 — Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
        <div>
          <h1
            className="text-[34px] font-medium tracking-[-0.02em] text-ink-900 leading-[1.1]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {d.greeting}
          </h1>
          <p className="text-[14px] text-ink-600 mt-2">{d.subtitle}</p>
        </div>
      </div>

      {/* ── Layer 2 — KPI row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          icon={Package}
          iconBg="bg-ink-900"
          iconColor="text-amber-500"
          label={kpi.totalProducts}
          value={allItems.length}
          sub={kpi.totalProductsSub}
        />
        <KpiCard
          icon={AlertTriangle}
          iconBg="bg-warning-100"
          iconColor="text-warning-700"
          label={kpi.toRefill}
          value={lowStockItems.length}
          sub={kpi.toRefillSub}
        />
        <div className="col-span-2 md:col-span-1">
          <KpiCard
            icon={Clock}
            iconBg="bg-info-100"
            iconColor="text-info-700"
            label={kpi.lastOrder}
            value={lastOrderValue}
            sub={lastOrderSub}
          />
        </div>
      </div>

      {/* ── Layer 3 — Quick actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <button
          onClick={() => router.push('/client/inventory')}
          className={cn(
            'flex items-center gap-3.5 px-5 py-4.5unded-xl min-h-16',
            'bg-paper border border-border text-ink-900',
            'text-[16px] font-semibold text-start',
            'transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm)'
          )}
        >
          <div className="w-11 h-11 rounded-[10px] bg-sand-100 flex items-center justify-center shrink-0">
            <PackageCheck size={20} className="text-ink-700" />
          </div>
          {d.actions.updateInventory}
        </button>

        <button
          onClick={() => router.push('/client/order')}
          className={cn(
            'flex items-center gap-3.5 px-5 py-4.5 rounded-xl min-h-16',
            'bg-amber-600 text-white',
            'text-[16px] font-semibold text-start',
            'transition-all duration-180 hover:-translate-y-px hover:bg-amber-700'
          )}
        >
          <div className="w-11 h-11 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-white" />
          </div>
          {d.actions.orderProducts}
        </button>
      </div>

      {/* ── Layer 4 — Low stock section ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-ink-900">{ls.title}</h2>
        </div>

        {lowStockItems.length === 0 ? (
          <CardShell title="">
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle size={24} className="text-success-700" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink-900">{ls.allGoodTitle}</p>
                <p className="text-[13px] text-ink-500 mt-1">{ls.allGoodSub}</p>
              </div>
            </div>
          </CardShell>
        ) : (
          <div className="flex flex-col gap-3">
            {lowStockItems.map((item) => (
              <LowStockItem
                key={item.id}
                item={item}
                labels={{
                  current: ls.current,
                  min: ls.min,
                  orderMore: ls.orderMore,
                  statusLow: ls.statusLow,
                  statusOut: ls.statusOut,
                }}
                onOrderMore={handleOrderMore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
