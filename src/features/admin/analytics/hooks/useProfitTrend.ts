import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { ProfitParams, ProfitTrendPoint } from '../types/analytics.types';

export function useProfitTrend(params: ProfitParams) {
  const query = useQuery({
    queryKey: ['analytics', 'profit-trend', params],
    queryFn: () => analyticsApi.profitTrend(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const points: ProfitTrendPoint[] = query.data?.data ?? [];

  return {
    trend: points,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
