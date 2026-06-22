import { apiClient } from '@/common/api';
import type { AuditLogListParams } from '../types/audit-logs.types';

export const auditLogsApi = {
  list: async (params?: AuditLogListParams) => {
    const response = await apiClient.get('/audit-logs', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/audit-logs/${id}`);
    return response.data;
  },
};
