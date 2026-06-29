'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useShopConsumption } from '@/features/admin/analytics/hooks/useShopConsumption';
import { useShops, ShopType } from '@/features/admin/shops';
import type { Shop } from '@/features/admin/shops';
import type { TrendPeriod } from '@/features/admin/analytics/types/analytics.types';

const CHART_LIMIT = 8;

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function ConsumptionTrendChart() {
  const { t, locale } = useI18n();
  const d = t.dashboard;
  const [mode, setMode] = useState<TrendPeriod>('daily');
  const [selectedShopId, setSelectedShopId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { items, totalPages, total, hasNext, hasPrev, isLoading, isFetching } = useShopConsumption(
    { period: mode, shopId: selectedShopId, page, limit: CHART_LIMIT },
    !!selectedShopId
  );

  const { shops: shopsData, isLoading: shopsLoading } = useShops({
    type: ShopType.SHOP,
    limit: 999,
  });
  const shopList: Shop[] = shopsData?.data ?? [];

  const chartData = useMemo(
    () =>
      items.map((item) => ({
        name: truncate(item.product_name, 10),
        fullName: item.product_name,
        value: item.quantity,
      })),
    [items]
  );

  const modes: TrendPeriod[] = ['daily', 'weekly', 'monthly'];
  const modeLabels: Record<TrendPeriod, string> = {
    daily: d.charts.daily,
    weekly: d.charts.weekly,
    monthly: d.charts.monthly,
  };

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  function handleShopChange(id: number | undefined) {
    setSelectedShopId(id);
    setPage(1);
  }

  function handleModeChange(m: TrendPeriod) {
    setMode(m);
    setPage(1);
  }

  return (
    <div>
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-0">
        {/* Shop selector */}
        <select
          value={selectedShopId ?? ''}
          onChange={(e) => handleShopChange(e.target.value ? Number(e.target.value) : undefined)}
          disabled={shopsLoading}
          className={cn(
            'text-[13px] font-medium bg-sand-100 border border-border rounded-full px-3.5 py-1.25 outline-none cursor-pointer disabled:opacity-50 transition-opacity',
            selectedShopId ? 'text-ink-700' : 'text-ink-400'
          )}
        >
          <option value="">{d.charts.selectShop}</option>
          {shopList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Period segmented control */}
        <div className="inline-flex items-center bg-sand-100 border border-border rounded-full p-0.75 gap-0.5">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              aria-pressed={m === mode}
              className={cn(
                'text-[13px] font-medium px-3.5 py-1.25 rounded-full transition-all duration-150',
                m === mode
                  ? 'bg-paper text-ink-900 shadow-(--shadow-xs)'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart area ── */}
      <div
        className={cn(
          'pt-5 pb-1 transition-opacity duration-200',
          isFetching && !isLoading && 'opacity-50'
        )}
      >
        {!selectedShopId ? (
          <div className="px-5 h-52 flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center">
              <Store size={18} className="text-ink-400" />
            </div>
            <p className="text-sm text-ink-400 text-center max-w-52">{d.charts.selectShopPrompt}</p>
          </div>
        ) : isLoading ? (
          <div className="px-5 h-52 flex items-end justify-around gap-1.5 pb-6">
            {Array.from({ length: CHART_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t skeleton-shimmer"
                style={{ height: `${25 + ((i * 37) % 65)}%` }}
              />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <div className="px-5 h-52 flex items-center justify-center text-sm text-ink-400">
            No data yet
          </div>
        ) : (
          /* Arrow buttons flank the chart — only rendered when there are multiple pages */
          <div className={cn('flex items-center', totalPages > 1 ? 'px-2 gap-1' : 'px-5')}>
            {totalPages > 1 && (
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev || isFetching}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border bg-sand-100 text-ink-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronLeft size={14} />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#7A8899' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#7A8899' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E8E2D6',
                      borderRadius: 8,
                      fontSize: 13,
                      color: '#0E1B2C',
                    }}
                    itemStyle={{ color: '#D97706' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    labelFormatter={(_: any, payload: readonly any[]) =>
                      payload?.[0]?.payload?.fullName ?? ''
                    }
                    formatter={(val) => [
                      typeof val === 'number' ? val.toLocaleString(localeCode) : String(val),
                      '',
                    ]}
                  />
                  <Bar dataKey="value" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {totalPages > 1 && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || isFetching}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-border bg-sand-100 text-ink-600 hover:bg-paper disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Page indicator ── */}
      {totalPages > 1 && chartData.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pb-3 text-[12px] text-ink-400 tabular-nums">
          <span>
            {page} / {totalPages}
          </span>
          <span>·</span>
          <span>{total.toLocaleString(localeCode)} products</span>
        </div>
      )}
    </div>
  );
}
