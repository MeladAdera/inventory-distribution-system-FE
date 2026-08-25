'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoneyGrouped, parseMoney } from '@/common/utils/money';
import { WEEKDAYS, type ShiftReportByShift } from '../../types/shifts.types';
import { weekdayNames } from '../../utils/time.utils';
import { InsufficientData } from '../ui/DataStates';

// One series, one hue — magnitude, not identity, so there is nothing to tell
// apart and no categorical palette to validate. The project's accent.
const BAR_FILL = '#d97706'; // amber-600
// A day the shop traded but sold nothing still gets a mark, so the reader sees
// a zero rather than a gap they have to interpret as missing data.
const ZERO_FILL = '#e8e2d6'; // border

interface SalesByDayChartProps {
  byShift: ShiftReportByShift[];
  locale: string;
  currency: string;
  labels: { title: string; amount: string; insufficient: string };
}

/**
 * Takings summed per weekday.
 *
 * Aggregated from `by_shift`, which carries a weekday on every row — the report
 * has no per-day grouping of its own, so several slots on one day fold together
 * here.
 */
export function SalesByDayChart({ byShift, locale, currency, labels }: SalesByDayChartProps) {
  const names = weekdayNames(locale, 'short');

  const data = useMemo(() => {
    const totals = new Map<number, number>(WEEKDAYS.map((w) => [w, 0]));
    byShift.forEach((row) => {
      totals.set(row.weekday, (totals.get(row.weekday) ?? 0) + parseMoney(row.sales_total));
    });
    return WEEKDAYS.map((w) => ({ weekday: w, name: names[w], sales: totals.get(w) ?? 0 }));
  }, [byShift, names]);

  const hasAny = data.some((d) => d.sales > 0);
  if (!hasAny) return <InsufficientData message={labels.insufficient} />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke="#f0ebe2" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6c7382', fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: '#fbf9f5' }}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e8e2d6',
              fontSize: 12,
            }}
            formatter={(value) => [
              `${formatMoneyGrouped(Number(value ?? 0))} ${currency}`,
              labels.amount,
            ]}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((entry) => (
              <Cell
                key={entry.weekday}
                fill={entry.sales > 0 ? BAR_FILL : ZERO_FILL}
                /* A zero day is drawn as a sliver at the baseline rather than
                   nothing at all — an absent bar reads as absent data. */
              />
            ))}
            <LabelList
              dataKey="sales"
              position="top"
              fontSize={11}
              fill="#4a515f"
              formatter={(value) => {
                const amount = Number(value ?? 0);
                return amount > 0 ? formatMoneyGrouped(amount) : '';
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
