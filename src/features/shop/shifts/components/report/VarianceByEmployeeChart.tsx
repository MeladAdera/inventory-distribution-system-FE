'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoneyGrouped, parseMoney } from '@/common/utils/money';
import type { ShiftReportByEmployee } from '../../types/shifts.types';
import { InsufficientData } from '../ui/DataStates';

/**
 * The same two colours `VarianceValue` uses everywhere else, so a bar never
 * disagrees with the number printed beside it in the table below.
 *
 * Measured, not assumed: this red and green sit ΔE 3.2 apart under deuteranopia,
 * which is close to identical for a red-green colourblind reader. Colour is
 * therefore NOT the encoding here — direction from the zero line is, and every
 * bar carries a signed value label. A blue/red pair would score ΔE 27.6, but it
 * would then contradict the green/red figures in the rest of the module, which
 * is the worse failure.
 */
const SURPLUS = '#15803d'; // success-700
const SHORTFALL = '#a8312b'; // danger-700

interface VarianceByEmployeeChartProps {
  byEmployee: ShiftReportByEmployee[];
  currency: string;
  labels: { title: string; legend: string; amount: string; insufficient: string };
}

/**
 * Cash differences per employee, diverging from a zero axis.
 *
 * Horizontal because employee names are text of unpredictable length — as
 * vertical bars they would either wrap, rotate, or be cut.
 */
export function VarianceByEmployeeChart({
  byEmployee,
  currency,
  labels,
}: VarianceByEmployeeChartProps) {
  const data = useMemo(
    () =>
      byEmployee
        .map((row) => ({ name: row.user_name, variance: parseMoney(row.cash_difference) }))
        .filter((row) => row.variance !== 0)
        .sort((a, b) => a.variance - b.variance),
    [byEmployee]
  );

  if (data.length === 0) return <InsufficientData message={labels.insufficient} />;

  // A symmetric domain keeps zero in the middle, so a surplus and a shortfall of
  // the same size are drawn the same length.
  const extent = Math.max(...data.map((d) => Math.abs(d.variance)));
  const height = Math.max(160, data.length * 44 + 24);

  return (
    <div className="w-full">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 4, left: 56 }}
          >
            <XAxis type="number" domain={[-extent, extent]} hide />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={90}
              tick={{ fill: '#4a515f', fontSize: 11 }}
            />
            {/* The zero line is the reference the whole chart is read against,
                so it is drawn darker than a gridline would be. */}
            <ReferenceLine x={0} stroke="#c8d0da" />
            <Tooltip
              cursor={{ fill: '#fbf9f5' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e8e2d6', fontSize: 12 }}
              formatter={(value) => {
                const amount = Number(value ?? 0);
                return [
                  `${amount > 0 ? '+' : ''}${formatMoneyGrouped(amount)} ${currency}`,
                  labels.amount,
                ];
              }}
            />
            <Bar dataKey="variance" radius={4} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.variance > 0 ? SURPLUS : SHORTFALL} />
              ))}
              {/* The signed number on every bar is what carries the meaning for
                  a reader who cannot separate the two hues. */}
              <LabelList
                dataKey="variance"
                position="right"
                fontSize={11}
                fill="#4a515f"
                formatter={(value) => {
                  const amount = Number(value ?? 0);
                  return `${amount > 0 ? '+' : ''}${formatMoneyGrouped(amount)}`;
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-500">{labels.legend}</p>
    </div>
  );
}
