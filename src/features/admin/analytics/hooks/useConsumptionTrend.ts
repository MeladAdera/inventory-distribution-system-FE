import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { TrendPeriod, TrendPoint } from '../types/analytics.types';

export function useConsumptionTrend(period: TrendPeriod) {
  const query = useQuery({
    queryKey: ['analytics', 'consumption-trend', period],
    queryFn: () => analyticsApi.consumptionTrend(period),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const points: TrendPoint[] = query.data?.data ?? [];

  return {
    trend: points,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
