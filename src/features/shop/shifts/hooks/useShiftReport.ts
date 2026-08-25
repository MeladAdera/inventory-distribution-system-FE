'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseMoney, subMoney, sumMoney } from '@/common/utils/money';
import { shiftsApi } from '../api/shifts.api';
import type { ShiftReport, ShiftReportParams } from '../types/shifts.types';
import { addDays, fromISODate, toISODate } from '../utils/time.utils';

const EMPTY_REPORT: ShiftReport = {
  from: null,
  to: null,
  by_employee: [],
  by_shift: [],
};

/**
 * Shift totals by employee and by slot. Owner only.
 *
 * The two groupings answer different questions and are attributed differently:
 * sales by who rang them up, cash differences by whose shift it was. An owner
 * selling during Sara's shift is the owner's sale but lands in Sara's drawer, so
 * the columns can legitimately disagree.
 */
export function useShiftReport(params?: ShiftReportParams, options?: { enabled?: boolean }) {
  const reportQuery = useQuery({
    queryKey: ['shifts', 'report', params],
    queryFn: () => shiftsApi.getReport(params),
    enabled: options?.enabled ?? true,
    staleTime: 0,
  });

  return {
    report: (reportQuery.data?.data as ShiftReport) ?? EMPTY_REPORT,
    isLoading: reportQuery.isLoading,
    error: reportQuery.error,
  };
}

/** Headline figures, summed from the by-employee grouping. */
export interface ReportTotals {
  sales: string;
  variance: string;
  shifts: number;
  receipts: number;
  employees: number;
}

function totalsOf(report: ShiftReport): ReportTotals {
  return {
    sales: sumMoney(report.by_employee.map((r) => r.sales_total)),
    variance: sumMoney(report.by_employee.map((r) => r.cash_difference)),
    shifts: report.by_employee.reduce((sum, r) => sum + r.shifts, 0),
    receipts: report.by_employee.reduce((sum, r) => sum + r.receipt_count, 0),
    employees: report.by_employee.length,
  };
}

/**
 * The period of equal length immediately before this one.
 *
 * Returns null when the report is unbounded — "all time" has no previous
 * period, and inventing one would compare against a window nobody chose.
 */
export function previousRange(params?: ShiftReportParams): ShiftReportParams | null {
  if (!params?.from || !params?.to) return null;
  const from = fromISODate(params.from);
  const to = fromISODate(params.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (days < 1) return null;
  const prevTo = addDays(from, -1);
  return { from: toISODate(addDays(prevTo, -(days - 1))), to: toISODate(prevTo) };
}

/**
 * The report plus the same figures for the preceding period, so the headline can
 * say which way things moved.
 *
 * Two requests rather than one because `GET /shifts/report` has no comparison
 * built in. The second is skipped entirely when no range is set.
 */
export function useShiftReportWithComparison(params?: ShiftReportParams) {
  const current = useShiftReport(params);
  const prevParams = useMemo(() => previousRange(params), [params]);
  const previous = useShiftReport(prevParams ?? undefined, { enabled: prevParams !== null });

  const totals = useMemo(() => totalsOf(current.report), [current.report]);
  const previousTotals = useMemo(
    () => (prevParams ? totalsOf(previous.report) : null),
    [prevParams, previous.report]
  );

  /**
   * Change in sales against the previous period, as a percentage.
   *
   * Null when there is nothing to divide by: a period that sold nothing cannot
   * be the base of a percentage, and "+∞%" is not a figure anyone can act on.
   */
  const salesDelta = useMemo(() => {
    if (!previousTotals) return null;
    const before = parseMoney(previousTotals.sales);
    if (before <= 0) return null;
    const change = parseMoney(subMoney(totals.sales, previousTotals.sales));
    return Math.round((change / before) * 100);
  }, [totals.sales, previousTotals]);

  return {
    report: current.report,
    totals,
    salesDelta,
    hasComparison: prevParams !== null,
    isLoading: current.isLoading,
    error: current.error,
  };
}
