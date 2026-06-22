'use client';

import { useRouter } from 'next/navigation';
import { Truck, Package } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useShortages } from '@/features/shared/shortages/hooks/useShortages';

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_90px] items-center px-5 py-2.5 gap-2',
        index > 0 && 'border-t border-border'
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded skeleton-shimmer"
          style={{ width: i === 0 ? '70%' : '50%' }}
        />
      ))}
      <div className="h-7 w-18 rounded-lg skeleton-shimmer" />
    </div>
  );
}

export function LowStockAlertsTable() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const d = t.dashboard.lowStock;

  const { shortages, isLoading } = useShortages();
  const rows = shortages.slice(0, 5);

  return (
    <div>
      {/* Column headers */}
      <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_90px] px-5 py-2.5 text-[11px] font-medium text-ink-400">
        <span>{d.colProduct}</span>
        <span>{d.colClient}</span>
        <span>{d.colRemaining}</span>
        <span>{d.colMin}</span>
        <span />
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} index={i} />)
      ) : rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-ink-400">
          No low stock items
        </div>
      ) : (
        rows.map((shortage, i) => {
          const product = locale === 'ar' ? shortage.product_name_ar : shortage.product_name_en;
          const client = locale === 'ar' ? shortage.client_name_ar : shortage.client_name_en;
          const isOut = shortage.status === 'out';

          return (
            <div
              key={shortage.id}
              className={cn(
                'grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_90px] items-center px-5 py-2.5',
                i > 0 && 'border-t border-border'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7.5 h-7.5 rounded-lg bg-sand-100 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-ink-500" />
                </div>
                <span className="text-[13px] font-medium text-ink-900 truncate">{product}</span>
              </div>

              <span className="text-[13px] text-ink-600 truncate">{client}</span>

              <span
                className={cn(
                  'text-[13px] font-semibold font-mono tabular-nums',
                  isOut ? 'text-danger-700' : 'text-warning-700'
                )}
              >
                {shortage.remaining}
              </span>

              <span className="text-[13px] text-ink-500 font-mono tabular-nums">
                {shortage.min_level}
              </span>

              <button
                onClick={() => router.push('/shortages')}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-600 bg-sand-100 hover:bg-sand-200 border border-border rounded-lg px-2.5 py-1.5 transition-colors"
              >
                <Truck size={13} />
                {d.replenish}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
