'use client';

import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { shiftsApi } from '../api/shifts.api';
import type {
  ShiftSessionDetail,
  ShiftSessionListParams,
  ShiftSessionRow,
} from '../types/shifts.types';

/**
 * Shift history. Owner only — GET /shifts/sessions is 403 for an EMPLOYEE.
 */
export function useShiftSessions(params?: ShiftSessionListParams) {
  const listQuery = useQuery({
    queryKey: ['shifts', 'sessions', params],
    queryFn: () => shiftsApi.getSessions(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const sessions: ShiftSessionRow[] = useMemo(
    () => listQuery.data?.data?.data ?? [],
    [listQuery.data]
  );

  /**
   * Rows bucketed by trading day, newest first, for the grouped table.
   *
   * Keyed on `business_date` and never on `opened_at`: a shift opened 23:30
   * Friday and closed 02:00 Saturday belongs to Friday, and splitting it out by
   * clock time would file one night's takings under two days.
   */
  const byBusinessDate = useMemo(() => {
    const map = new Map<string, ShiftSessionRow[]>();
    sessions.forEach((s) => {
      const bucket = map.get(s.business_date);
      if (bucket) bucket.push(s);
      else map.set(s.business_date, [s]);
    });
    return map;
  }, [sessions]);

  return {
    sessions,
    byBusinessDate,
    total: (listQuery.data?.data?.total as number) ?? 0,
    totalPages: (listQuery.data?.data?.totalPages as number) ?? 1,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
  };
}

/**
 * One shift with the receipts behind it.
 *
 * Pass null to keep the query idle while the detail modal is closed. An employee
 * may read only shifts they worked; anything else is 403
 * `shift.SESSION_ACCESS_DENIED`.
 */
export function useShiftSessionDetail(id: number | null) {
  const detailQuery = useQuery({
    queryKey: ['shifts', 'sessions', 'detail', id],
    queryFn: () => shiftsApi.getSessionById(id as number),
    enabled: id !== null,
    staleTime: 0,
  });

  return {
    session: (detailQuery.data?.data as ShiftSessionDetail) ?? null,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error,
  };
}
