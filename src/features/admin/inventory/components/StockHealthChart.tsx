'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/providers/I18nProvider';
import type { AdminInventoryStats } from '../hooks/useAdminInventory';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

interface Props {
  stats: AdminInventoryStats;
  isLoading: boolean;
}

export function StockHealthChart({ stats, isLoading }: Props) {
  const { t, locale } = useI18n();
  const iv = t.inventory;

  const healthyCount = stats.totalSKUs - stats.lowStockCount - stats.outOfStockCount;

  const data = [
    { name: iv.charts.healthy, value: healthyCount },
    { name: iv.charts.low, value: stats.lowStockCount },
    { name: iv.charts.out, value: stats.outOfStockCount },
  ].filter((d) => d.value > 0);

  const isEmpty = stats.totalSKUs === 0;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-55">
      {isLoading ? (
        <div className="w-36 h-36 rounded-full skeleton-shimmer" />
      ) : isEmpty ? (
        <p className="text-sm text-ink-400">{iv.charts.noData}</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                startAngle={locale === 'ar' ? -90 : 90}
                endAngle={locale === 'ar' ? 270 : 450}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E8E2D6',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#0E1B2C',
                }}
                formatter={(val, name) => [
                  `${typeof val === 'number' ? val.toLocaleString() : String(val)} ${iv.charts.units}`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
            {[
              { label: iv.charts.healthy, color: COLORS[0], count: healthyCount },
              { label: iv.charts.low, color: COLORS[1], count: stats.lowStockCount },
              { label: iv.charts.out, color: COLORS[2], count: stats.outOfStockCount },
            ].map(({ label, color, count }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[12px] text-ink-500">{label}</span>
                <span className="text-[12px] font-medium text-ink-800 tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
