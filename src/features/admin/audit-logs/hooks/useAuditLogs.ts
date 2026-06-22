'use client';

import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../api/audit-logs.api';
import type { AuditLogListParams } from '../types/audit-logs.types';

export function useAuditLogs(params?: AuditLogListParams) {
  const listQuery = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditLogsApi.list(params),
  });

  return {
    auditLogs: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
  };
}
