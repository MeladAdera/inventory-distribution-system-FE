import { apiClient } from '@/common/api';
import type { TrendPeriod, ShopConsumptionParams, ProfitParams } from '../types/analytics.types';

export const analyticsApi = {
  topProducts: async (limit = 5) => {
    const response = await apiClient.get('/analytics/top-products', { params: { limit } });
    return response.data;
  },

  consumptionTrend: async (period: TrendPeriod) => {
    const response = await apiClient.get('/analytics/consumption-trend', { params: { period } });
    return response.data;
  },

  shopConsumption: async (params?: ShopConsumptionParams) => {
    const response = await apiClient.get('/analytics/shop-consumption', { params });
    return response.data;
  },

  profitSummary: async (params?: ProfitParams) => {
    const response = await apiClient.get('/analytics/profit-summary', { params });
    return response.data;
  },

  profitTrend: async (params?: ProfitParams) => {
    const response = await apiClient.get('/analytics/profit-trend', { params });
    return response.data;
  },
};
