'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { useConsumptionTrend } from '@/features/admin/analytics/hooks/useConsumptionTrend';
import type { TrendPeriod } from '@/features/admin/analytics/types/analytics.types';

type Mode = TrendPeriod;

export function ConsumptionTrendChart() {
  const { t, locale } = useI18n();
  const d = t.dashboard;
  const [mode, setMode] = useState<Mode>('daily');

  const { trend, isLoading, isFetching } = useConsumptionTrend(mode);

  const data = trend.map((p, i) => ({ idx: i, value: p.value, label: p.label }));
  const lastIdx = data.length - 1;

  const modes: Mode[] = ['daily', 'weekly', 'monthly'];
  const modeLabels: Record<Mode, string> = {
    daily: d.charts.daily,
    weekly: d.charts.weekly,
    monthly: d.charts.monthly,
  };

  return (
    <div>
      {/* Segmented control */}
      <div className="flex items-center justify-end px-5 pt-4 pb-0">
        <div className="inline-flex items-center bg-sand-100 border border-border rounded-full p-0.75 gap-0.5">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
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

      {/* Chart */}
      <div
        className={cn(
          'px-5 pt-5 pb-2.5 transition-opacity duration-200',
          isFetching && !isLoading && 'opacity-50'
        )}
      >
        {isLoading ? (
          <div className="h-50 items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-50 flex items-center justify-center text-sm text-ink-400">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" vertical={false} />
              <XAxis
                dataKey="idx"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tick={(props: any) => {
                  const isLast = props.payload.value === lastIdx;
                  return (
                    <text
                      x={props.x}
                      y={Number(props.y) + 12}
                      textAnchor="middle"
                      fontSize={11}
                      fill={isLast ? '#2C3E52' : '#7A8899'}
                      fontWeight={isLast ? 600 : 400}
                    >
                      {isLast ? d.charts.today : ''}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
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
                itemStyle={{ color: '#D97706' }}
                formatter={(val) => [
                  typeof val === 'number'
                    ? val.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')
                    : String(val),
                  '',
                ]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={(_: any, payload: readonly any[]) =>
                  payload?.[0]?.payload?.label ?? ''
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D97706"
                strokeWidth={2}
                fill="url(#consumptionGradient)"
                dot={{ r: 3, fill: '#D97706', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#D97706', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
