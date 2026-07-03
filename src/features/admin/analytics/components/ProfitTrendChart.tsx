'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/common/utils/cn';
import type { ProfitTrendPoint } from '../types/analytics.types';

const REVENUE_COLOR = '#D97706'; // amber-600 (brand)
const PROFIT_COLOR = '#16A34A'; // green-600
const COST_COLOR = '#94A3B8'; // slate-400 — tooltip only

interface ProfitTrendChartProps {
  points: ProfitTrendPoint[];
  isLoading: boolean;
  isFetching: boolean;
  localeCode: string;
  labels: { revenue: string; cost: string; profit: string; empty: string };
  formatMoney: (n: number) => string;
}

export function ProfitTrendChart({
  points,
  isLoading,
  isFetching,
  localeCode,
  labels,
  formatMoney,
}: ProfitTrendChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-end justify-around gap-1.5 pb-6 px-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t skeleton-shimmer"
            style={{ height: `${25 + ((i * 37) % 65)}%` }}
          />
        ))}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-ink-400">
        {labels.empty}
      </div>
    );
  }

  const compact = new Intl.NumberFormat(localeCode, { notation: 'compact' });

  return (
    <div className={cn('transition-opacity duration-200', isFetching && 'opacity-50')}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#7A8899' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#7A8899' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => compact.format(v)}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 8,
              fontSize: 13,
              color: '#0E1B2C',
            }}
            formatter={(val, name) => [
              typeof val === 'number' ? formatMoney(val) : String(val),
              String(name),
            ]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="monotone"
            dataKey="revenue"
            name={labels.revenue}
            stroke={REVENUE_COLOR}
            strokeWidth={2}
            dot={{ r: 2.5, fill: REVENUE_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="cost"
            name={labels.cost}
            stroke={COST_COLOR}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name={labels.profit}
            stroke={PROFIT_COLOR}
            strokeWidth={2}
            dot={{ r: 2.5, fill: PROFIT_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
