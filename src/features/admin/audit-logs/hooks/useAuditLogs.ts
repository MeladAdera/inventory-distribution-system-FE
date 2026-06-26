'use client';

import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../api/audit-logs.api';
import type { AuditLog, AuditLogDetail, AuditLogListParams } from '../types/audit-logs.types';

export function useAuditLogs(params?: AuditLogListParams) {
  const listQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogsApi.list(params),
  });

  const logs: AuditLog[] = listQuery.data?.data?.data ?? [];
  const total: number = listQuery.data?.data?.total ?? 0;
  const totalPages: number = listQuery.data?.data?.totalPages ?? 1;

  return {
    logs,
    total,
    totalPages,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
  };
}

export function useAuditLogDetail(id: number | null) {
  const query = useQuery({
    queryKey: ['audit-log-detail', id],
    queryFn: () => auditLogsApi.getById(id!),
    enabled: !!id,
  });

  return {
    log: (query.data?.data ?? null) as AuditLogDetail | null,
    isLoading: query.isLoading,
  };
}
