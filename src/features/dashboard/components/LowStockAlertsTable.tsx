'use client';

import { Truck, Package } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { SHORTAGES } from '../mock/dashboardData';

interface LowStockAlertsTableProps {
  onReplenish?: (id: string) => void;
}

export function LowStockAlertsTable({ onReplenish }: LowStockAlertsTableProps) {
  const { t, locale } = useI18n();
  const d = t.dashboard.lowStock;

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_90px] px-5 py-2.5 text-[11px] font-medium text-ink-400">
        <span>{d.colProduct}</span>
        <span>{d.colClient}</span>
        <span>{d.colRemaining}</span>
        <span>{d.colMin}</span>
        <span />
      </div>

      {/* Data rows */}
      {SHORTAGES.map((row, i) => {
        const product = locale === 'ar' ? row.productAr : row.productEn;
        const client = locale === 'ar' ? row.clientAr : row.clientEn;
        const isOut = row.status === 'out';

        return (
          <div
            key={row.id}
            className={cn(
              'grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_90px] items-center px-5 py-2.5',
              i > 0 && 'border-t border-border'
            )}
          >
            {/* Product */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7.5 h-7.5 rounded-lg bg-sand-100 flex items-center justify-center shrink-0">
                <Package size={14} className="text-ink-500" />
              </div>
              <span className="text-[13px] font-medium text-ink-900 truncate">{product}</span>
            </div>

            {/* Client */}
            <span className="text-[13px] text-ink-600 truncate">{client}</span>

            {/* Remaining */}
            <span
              className={cn(
                'text-[13px] font-semibold font-mono tabular-nums',
                isOut ? 'text-danger-700' : 'text-warning-700'
              )}
            >
              {row.remaining}
            </span>

            {/* Min */}
            <span className="text-[13px] text-ink-500 font-mono tabular-nums">{row.min}</span>

            {/* Action */}
            <button
              onClick={() => onReplenish?.(row.id)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-600 bg-sand-100 hover:bg-sand-200 border border-border rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <Truck size={13} />
              {d.replenish}
            </button>
          </div>
        );
      })}
    </div>
  );
}
