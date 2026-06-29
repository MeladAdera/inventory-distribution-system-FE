'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/providers/I18nProvider';
import { useTopProducts } from '@/features/admin/analytics/hooks/useTopProducts';

const SLICE_COLORS = [
  '#D97706', // amber-600  (brand)
  '#2563EB', // blue-600
  '#16A34A', // green-600
  '#DC2626', // red-600
  '#7C3AED', // violet-600
  '#0891B2', // cyan-600
  '#EA580C', // orange-600
];

const OTHERS_COLOR = '#94A3B8'; // slate-400

// Max slices shown individually — everything beyond this is grouped into "Others"
const DISPLAY_LIMIT = 7;

export function TopConsumedChart() {
  const { t, locale } = useI18n();
  const d = t.dashboard;
  const { topProducts, isLoading } = useTopProducts(20);
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  const { chartData, total } = useMemo(() => {
    const topN = topProducts.slice(0, DISPLAY_LIMIT);
    const rest = topProducts.slice(DISPLAY_LIMIT);
    const othersTotal = rest.reduce((sum, p) => sum + p.total_quantity, 0);
    const grandTotal = topProducts.reduce((sum, p) => sum + p.total_quantity, 0);

    const slices = topN.map((p, i) => ({
      name: p.product_name,
      value: p.total_quantity,
      isOthers: false,
      fill: SLICE_COLORS[i % SLICE_COLORS.length],
    }));

    if (othersTotal > 0) {
      slices.push({
        name: d.charts.others,
        value: othersTotal,
        isOthers: true,
        fill: OTHERS_COLOR,
      });
    }

    return { chartData: slices, total: grandTotal };
  }, [topProducts, d.charts.others]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-40 h-40 rounded-full skeleton-shimmer" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 w-full">
            <div className="w-2.5 h-2.5 rounded-full skeleton-shimmer shrink-0" />
            <div className="h-3 rounded skeleton-shimmer flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-ink-400">No data yet</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Donut chart */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={196}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
              paddingAngle={2}
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
              formatter={(val, _, entry) => {
                const pct =
                  total > 0 && typeof val === 'number'
                    ? ` (${Math.round((val / total) * 100)}%)`
                    : '';
                return [
                  `${typeof val === 'number' ? val.toLocaleString(localeCode) : val}${pct}`,
                  entry.payload?.name ?? '',
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center: total units */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-xl font-bold text-ink-900 tabular-nums leading-tight">
              {total.toLocaleString(localeCode)}
            </div>
            <div className="text-[11px] text-ink-400 uppercase tracking-wide mt-0.5">
              {d.charts.units}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {chartData.map((item, i) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: item.fill }}
              />
              <span className="text-sm text-ink-800 truncate flex-1">{item.name}</span>
              <span className="text-xs font-mono text-ink-600 tabular-nums shrink-0">
                {item.value.toLocaleString(localeCode)}
              </span>
              <span className="text-xs text-ink-400 tabular-nums shrink-0 w-7 text-end">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
