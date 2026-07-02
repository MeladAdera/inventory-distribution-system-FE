'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

const CHART_LIMIT = 8;

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
}

export function TopStockChart({ items, isLoading }: Props) {
  const { t, locale } = useI18n();
  const iv = t.inventory;
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  const [page, setPage] = useState(1);

  // Sort all items by quantity desc once, then paginate client-side
  const sorted = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.current_quantity - a.current_quantity)
        .map((item) => ({
          name: truncate(item.product_name ?? `#${item.product_id}`, 12),
          fullName: item.product_name ?? `Product ${item.product_id}`,
          value: item.current_quantity,
        })),
    [items]
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / CHART_LIMIT));
  const safePage = Math.min(page, totalPages);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;
  const chartData = sorted.slice((safePage - 1) * CHART_LIMIT, safePage * CHART_LIMIT);

  if (isLoading) {
    return (
      <div className="flex items-end justify-around gap-1.5 h-55 pb-6 px-2">
        {Array.from({ length: CHART_LIMIT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-shimmer"
            style={{ height: `${20 + ((i * 29) % 70)}%` }}
          />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-55 text-sm text-ink-400">
        {iv.charts.noData}
      </div>
    );
  }

  return (
    <div className="pt-2 pb-1">
      {/* Chart + arrow buttons */}
      <div className={totalPages > 1 ? 'flex items-center px-2 gap-1' : 'px-2'}>
        {totalPages > 1 && (
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border bg-sand-100 text-ink-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#7A8899' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#7A8899' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E8E2D6',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#0E1B2C',
                }}
                itemStyle={{ color: '#2563eb' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(_: any, payload: readonly any[]) =>
                  payload?.[0]?.payload?.fullName ?? ''
                }
                formatter={(val) => [
                  `${typeof val === 'number' ? val.toLocaleString(localeCode) : String(val)} ${iv.charts.units}`,
                  '',
                ]}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {totalPages > 1 && (
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-border bg-sand-100 text-ink-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Page indicator — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2 text-[12px] text-ink-400 tabular-nums">
          <span>
            {safePage} / {totalPages}
          </span>
          <span>·</span>
          <span>
            {total.toLocaleString(localeCode)} {iv.charts.units}
          </span>
        </div>
      )}
    </div>
  );
}
