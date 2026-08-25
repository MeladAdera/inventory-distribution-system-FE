'use client';

import { formatMoneyGrouped } from '@/common/utils/money';
import { KpiCard } from '../ui/KpiCard';
import { VarianceValue } from '../ui/VarianceValue';
import type { ReportTotals } from '../../hooks/useShiftReport';

interface ReportKpisProps {
  totals: ReportTotals;
  /** Percentage change in sales against the preceding period; null when there is none. */
  salesDelta: number | null;
  hasComparison: boolean;
  currency: string;
  labels: {
    totalSales: string;
    employees: string;
    shifts: string;
    receipts: string;
    netVariance: string;
    vsPrevious: string;
    noComparison: string;
  };
}

/**
 * The five headline figures, sales leading as the navy hero.
 *
 * Above the charts and tables on purpose: the redesign is explicit that no table
 * should be the first thing on the page, because an owner opening Reports wants
 * the number before the breakdown.
 */
export function ReportKpis({
  totals,
  salesDelta,
  hasComparison,
  currency,
  labels,
}: ReportKpisProps) {
  const deltaLine = !hasComparison
    ? labels.noComparison
    : salesDelta === null
      ? undefined
      : labels.vsPrevious.replace('{delta}', `${salesDelta > 0 ? '+' : ''}${salesDelta}%`);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard
        variant="hero"
        label={labels.totalSales}
        value={
          <span dir="ltr">
            {formatMoneyGrouped(totals.sales)} {currency}
          </span>
        }
        context={deltaLine}
        className="col-span-2 lg:col-span-1"
      />
      <KpiCard label={labels.shifts} value={totals.shifts} />
      <KpiCard label={labels.employees} value={totals.employees} />
      <KpiCard label={labels.receipts} value={totals.receipts} />
      {/* The one figure here that can be bad news, so it keeps the semantic
          colour and its sign rather than reading as a plain total. */}
      <KpiCard
        label={labels.netVariance}
        value={<VarianceValue value={totals.variance} currency={currency} />}
      />
    </div>
  );
}
