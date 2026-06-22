import { apiClient } from '@/common/api';
import type { TrendPeriod } from '../types/analytics.types';

export const analyticsApi = {
  topProducts: async (limit = 5) => {
    const response = await apiClient.get('/analytics/top-products', { params: { limit } });
    return response.data;
  },

  consumptionTrend: async (period: TrendPeriod) => {
    const response = await apiClient.get('/analytics/consumption-trend', { params: { period } });
    return response.data;
  },
};
