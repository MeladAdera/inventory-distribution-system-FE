'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { DateRangeChip } from '@/common/components';
import { Button } from '@/common/components/ui/button';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { formatMoneyGrouped } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useShiftReportWithComparison } from '../hooks/useShiftReport';
import { weekdayNames } from '../utils/time.utils';
import { ReportKpis } from './report/ReportKpis';
import { SalesByDayChart } from './report/SalesByDayChart';
import { VarianceByEmployeeChart } from './report/VarianceByEmployeeChart';
import { ShiftReportTables } from './report/ShiftReportTables';
import { ErrorState, KpiSkeleton, TableSkeleton } from './ui/DataStates';

/**
 * Shift totals by employee and by slot. Owner only.
 *
 * Order is deliberate and fixed: filters, then the headline figures, then the
 * charts, then the tables. An owner opening this page wants the number before
 * the breakdown, and the redesign is explicit that no table leads the page.
 */
export function ReportTab() {
  const { t, locale } = useI18n();
  const s = t.shifts;
  const queryClient = useQueryClient();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = useMemo(() => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) }), [from, to]);

  const { report, totals, salesDelta, hasComparison, isLoading, error } =
    useShiftReportWithComparison(params);

  function handleExport() {
    const names = weekdayNames(locale);
    downloadCsv(
      dateStampedName(`${s.export.filename}-${s.report.title}`),
      [
        s.report.cols.employee,
        s.report.cols.shifts,
        s.report.cols.receipts,
        s.report.cols.sold,
        s.report.cols.difference,
        s.report.cols.shortShifts,
      ],
      [
        ...report.by_employee.map((r) => [
          r.user_name,
          r.shifts,
          r.receipt_count,
          formatMoneyGrouped(r.sales_total),
          r.cash_difference,
          r.short_shifts,
        ]),
        // A totals row so the exported file adds up on its own, without the
        // reader re-summing a column in a spreadsheet.
        [
          s.report.totals,
          totals.shifts,
          totals.receipts,
          formatMoneyGrouped(totals.sales),
          totals.variance,
          '',
        ],
        [],
        [
          s.report.cols.shift,
          s.report.cols.weekday,
          s.report.cols.shifts,
          s.report.cols.sold,
          s.report.cols.difference,
        ],
        ...report.by_shift.map((r) => [
          r.shift_template_name ?? s.report.outsideAnyShift,
          names[r.weekday],
          r.shifts,
          formatMoneyGrouped(r.sales_total),
          r.cash_difference,
        ]),
      ]
    );
  }

  if (error) {
    return (
      <ErrorState
        title={s.report.errorMsg}
        detail={getErrorMessage(error)}
        retryLabel={s.page.retry}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['shifts'] })}
      />
    );
  }

  const hasRows = report.by_employee.length > 0 || report.by_shift.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-ink-900">{s.report.title}</h2>
          <p className="mt-1 text-[13px] text-ink-500">{s.report.subtitle}</p>
        </div>
        {hasRows && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={14} />
            {s.report.exportCsv}
          </Button>
        )}
      </header>

      {/* The same range pill as debts, receipts and the shift history. */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeChip
          fromDate={from}
          toDate={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onClear={() => {
            setFrom('');
            setTo('');
          }}
          locale={locale}
          labels={{
            from: s.history.filters.from,
            to: s.history.filters.to,
            clear: s.history.filters.clear,
          }}
        />
      </div>

      {isLoading ? (
        <>
          <KpiSkeleton count={5} />
          <TableSkeleton rows={4} />
        </>
      ) : !hasRows ? (
        <p className="rounded-xl border border-dashed border-border bg-paper py-12 text-center text-[14px] text-ink-400">
          {s.report.empty}
        </p>
      ) : (
        <>
          <ReportKpis
            totals={totals}
            salesDelta={salesDelta}
            hasComparison={hasComparison}
            currency={t.debts.currency}
            labels={s.report.kpis}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={s.report.charts.salesByDay}>
              <SalesByDayChart
                byShift={report.by_shift}
                locale={locale}
                currency={t.debts.currency}
                labels={{
                  title: s.report.charts.salesByDay,
                  amount: s.report.charts.amount,
                  insufficient: s.report.charts.insufficient,
                }}
              />
            </ChartCard>

            <ChartCard title={s.report.charts.varianceByEmployee}>
              <VarianceByEmployeeChart
                byEmployee={report.by_employee}
                currency={t.debts.currency}
                labels={{
                  title: s.report.charts.varianceByEmployee,
                  legend: s.report.charts.varianceLegend,
                  amount: s.report.charts.amount,
                  insufficient: s.report.charts.insufficient,
                }}
              />
            </ChartCard>
          </div>

          <ShiftReportTables
            report={report}
            totals={totals}
            locale={locale}
            currency={t.debts.currency}
            labels={s.report}
          />
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-paper p-4">
      {/* One series each, so the title names the measure and no legend box is
          needed to tell colours apart. */}
      <h3 className="mb-3 text-[13.5px] font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}
