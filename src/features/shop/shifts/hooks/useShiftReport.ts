'use client';

import { useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../api/shifts.api';
import type { ShiftReport, ShiftReportParams } from '../types/shifts.types';

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
export function useShiftReport(params?: ShiftReportParams) {
  const reportQuery = useQuery({
    queryKey: ['shifts', 'report', params],
    queryFn: () => shiftsApi.getReport(params),
    staleTime: 0,
  });

  return {
    report: (reportQuery.data?.data as ShiftReport) ?? EMPTY_REPORT,
    isLoading: reportQuery.isLoading,
    error: reportQuery.error,
  };
}
