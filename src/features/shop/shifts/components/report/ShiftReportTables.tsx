'use client';

import { cn } from '@/common/utils/cn';
import { formatMoneyGrouped } from '@/common/utils/money';
import type { ShiftReport } from '../../types/shifts.types';
import type { ReportTotals } from '../../hooks/useShiftReport';
import { weekdayNames } from '../../utils/time.utils';
import { VarianceValue } from '../ui/VarianceValue';

interface ShiftReportTablesProps {
  report: ShiftReport;
  /** Column sums, so the table foots without the reader re-adding it. */
  totals: ReportTotals;
  locale: string;
  currency: string;
  labels: {
    subtitle: string;
    empty: string;
    totals: string;
    byEmployee: string;
    byShift: string;
    outsideAnyShift: string;
    cols: {
      employee: string;
      shift: string;
      weekday: string;
      shifts: string;
      receipts: string;
      sold: string;
      difference: string;
      shortShifts: string;
    };
    shortShiftsHint: string;
  };
}

/**
 * Totals by employee and by slot.
 *
 * The two groupings are attributed differently and will legitimately disagree:
 * sales go to whoever rang them up, cash differences to whose shift it was. An
 * owner selling during Sara's shift is the owner's sale but lands in Sara's
 * drawer — the note above the tables says so, because the alternative is an
 * owner reading it as a discrepancy.
 */
export function ShiftReportTables({
  report,
  totals,
  locale,
  currency,
  labels,
}: ShiftReportTablesProps) {
  const names = weekdayNames(locale);
  const isEmpty = report.by_employee.length === 0 && report.by_shift.length === 0;

  if (isEmpty) {
    return <p className="py-12 text-center text-[14px] text-ink-400">{labels.empty}</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={labels.byEmployee}>
        <Table
          head={
            <>
              <Th>{labels.cols.employee}</Th>
              <Th align="end">{labels.cols.shifts}</Th>
              <Th align="end">{labels.cols.receipts}</Th>
              <Th align="end">{labels.cols.sold}</Th>
              <Th align="end">{labels.cols.difference}</Th>
              <Th align="end" title={labels.shortShiftsHint}>
                {labels.cols.shortShifts}
              </Th>
            </>
          }
        >
          {report.by_employee.map((row) => (
            <tr key={row.user_id} className="border-b border-border last:border-0">
              <Td>
                <span className="font-medium text-ink-800">{row.user_name}</span>
              </Td>
              <Num>{row.shifts}</Num>
              <Num>{row.receipt_count}</Num>
              <Num>
                <span dir="ltr">
                  {formatMoneyGrouped(row.sales_total)} {currency}
                </span>
              </Num>
              <Td align="end">
                <VarianceValue value={row.cash_difference} />
              </Td>
              <Num>
                <span className={cn(row.short_shifts > 0 && 'font-medium text-danger-700')}>
                  {row.short_shifts}
                </span>
              </Num>
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-subtle font-semibold">
            <Td>
              <span className="text-ink-900">{labels.totals}</span>
            </Td>
            <Num>{totals.shifts}</Num>
            <Num>{totals.receipts}</Num>
            <Num>
              <span dir="ltr">
                {formatMoneyGrouped(totals.sales)} {currency}
              </span>
            </Num>
            <Td align="end">
              <VarianceValue value={totals.variance} />
            </Td>
            <Num />
          </tr>
        </Table>
      </Card>

      <Card title={labels.byShift}>
        <Table
          head={
            <>
              <Th>{labels.cols.shift}</Th>
              <Th>{labels.cols.weekday}</Th>
              <Th align="end">{labels.cols.shifts}</Th>
              <Th align="end">{labels.cols.receipts}</Th>
              <Th align="end">{labels.cols.sold}</Th>
              <Th align="end">{labels.cols.difference}</Th>
            </>
          }
        >
          {report.by_shift.map((row) => (
            <tr
              key={`${row.shift_template_id ?? 'none'}-${row.weekday}`}
              className="border-b border-border last:border-0"
            >
              <Td>
                {/* Null means the shift ran with no slot on the clock. */}
                {row.shift_template_name ?? (
                  <span className="text-ink-400">{labels.outsideAnyShift}</span>
                )}
              </Td>
              <Td>
                <span className="text-ink-600">{names[row.weekday]}</span>
              </Td>
              <Num>{row.shifts}</Num>
              <Num>{row.receipt_count}</Num>
              <Num>
                <span dir="ltr">
                  {formatMoneyGrouped(row.sales_total)} {currency}
                </span>
              </Num>
              <Td align="end">
                <VarianceValue value={row.cash_difference} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ── Bits ──────────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-paper">
      <h3 className="border-b border-border px-4 py-2.5 text-[14px] font-semibold text-ink-900">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-[13px]">
        <thead>
          <tr className="border-b border-border bg-page text-[12px] text-ink-500">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = 'start',
  title,
}: {
  children: React.ReactNode;
  align?: 'start' | 'end';
  title?: string;
}) {
  return (
    <th
      title={title}
      className={cn('px-4 py-2 font-medium', align === 'end' ? 'text-end' : 'text-start')}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'start' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return (
    <td className={cn('px-4 py-2.5', align === 'end' ? 'text-end' : 'text-start')}>{children}</td>
  );
}

function Num({ children }: { children?: React.ReactNode }) {
  return <td className="px-4 py-2.5 text-end tabular-nums text-ink-700">{children}</td>;
}
