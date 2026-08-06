'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/common/utils/cn';
import { formatMoney } from '@/common/utils/money';
import { AgingBucket } from '../types/debts.types';
import type { AgingRow } from '../types/debts.types';

// A SEQUENTIAL ramp, not a traffic light. The buckets are one ordered quantity —
// how long money has gone uncollected — so a single hue darkening with age is the
// honest encoding, and it stays monotonic in lightness (L 0.77 → 0.67 → 0.56).
//
// Deliberately NOT green/amber/red: the project's warning-700 (#92400E) and
// danger-700 (#A8312B) sit ΔE 2.6 apart under deuteranopia and 5.9 for normal
// vision, so two of the three bars would have been indistinguishable.
const BUCKET_FILL: Record<AgingBucket, string> = {
  [AgingBucket.RECENT]: '#F59E0B', // amber-500
  [AgingBucket.LATE]: '#D97706', // amber-600
  [AgingBucket.OVERDUE]: '#B45309', // amber-700
};

/**
 * Money grouped by how long it has been outstanding.
 *
 * Serves both directions: what customers and shops owe (receivables) and what a
 * shop owes its own suppliers (payables). The two use the same three buckets and
 * the same `AgingRow` shape, so only the rows passed in differ.
 */
interface DebtAgingChartProps {
  rows: AgingRow[];
  isLoading: boolean;
  isFetching: boolean;
  /**
   * Highlights the bucket currently filtering the list below. Omitted where the
   * chart is read-only — the payables view lists suppliers, not bills, and
   * `GET /suppliers` takes no aging filter to click through to.
   */
  activeBucket?: AgingBucket | '';
  onSelectBucket?: (bucket: AgingBucket) => void;
  localeCode: string;
  labels: {
    amount: string;
    count: string;
    empty: string;
    bucketNames: Record<AgingBucket, string>;
  };
}

export function DebtAgingChart({
  rows,
  isLoading,
  isFetching,
  activeBucket,
  onSelectBucket,
  localeCode,
  labels,
}: DebtAgingChartProps) {
  if (isLoading) {
    return (
      <div className="h-56 flex items-end justify-around gap-6 pb-6 px-5">
        {[55, 35, 70].map((h, i) => (
          <div key={i} className="flex-1 rounded-t skeleton-shimmer" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  // Distinguish "no debts at all" from "some buckets are empty" — the API always
  // returns three rows, so an all-zero response is the real empty state.
  const allZero = rows.every((r) => r.count === 0);
  if (allZero) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-ink-400">
        {labels.empty}
      </div>
    );
  }

  const compact = new Intl.NumberFormat(localeCode, { notation: 'compact' });
  const data = rows.map((r) => ({
    ...r,
    label: labels.bucketNames[r.bucket],
    value: Number(r.amount),
  }));

  return (
    <div className={cn('transition-opacity duration-200', isFetching && 'opacity-50')}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 12, left: -12, bottom: 0 }}
          barCategoryGap="28%"
        >
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
            cursor={{ fill: '#F5EFE4', opacity: 0.5 }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #E8E2D6',
              borderRadius: 8,
              fontSize: 13,
              color: '#0E1B2C',
            }}
            formatter={(value, _name, item) => [
              `${formatMoney(Number(value))} · ${labels.count.replace(
                '{n}',
                String((item?.payload as AgingRow | undefined)?.count ?? 0)
              )}`,
              labels.amount,
            ]}
          />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            maxBarSize={72}
            // recharts hands the clicked bar over as either the datum itself or
            // wrapped in `.payload`, depending on version. Accept both — guessing
            // wrong makes the click-through fail silently, with nothing to debug.
            onClick={(entry: unknown) => {
              const e = entry as { bucket?: AgingBucket; payload?: { bucket?: AgingBucket } };
              const bucket = e?.payload?.bucket ?? e?.bucket;
              if (bucket) onSelectBucket?.(bucket);
            }}
            className={onSelectBucket ? 'cursor-pointer' : undefined}
          >
            {data.map((d) => (
              <Cell
                key={d.bucket}
                fill={BUCKET_FILL[d.bucket]}
                // Dim the non-selected bars once a bucket is filtering the list.
                opacity={activeBucket && activeBucket !== d.bucket ? 0.35 : 1}
              />
            ))}
            {/* Direct labels on all three bars: the exact figure matters here, and
                they double as the required relief for amber-500's low contrast. */}
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              formatter={(v: unknown) => formatMoney(Number(v))}
              style={{ fontSize: 11, fontWeight: 600, fill: '#3F4D60' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
