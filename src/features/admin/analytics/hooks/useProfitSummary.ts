import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { ProfitParams, ProfitSummary } from '../types/analytics.types';

const EMPTY_SUMMARY: ProfitSummary = { revenue: 0, cost: 0, profit: 0 };

export function useProfitSummary(params: ProfitParams) {
  const query = useQuery({
    queryKey: ['analytics', 'profit-summary', params],
    queryFn: () => analyticsApi.profitSummary(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const summary: ProfitSummary = query.data?.data ?? EMPTY_SUMMARY;

  return {
    summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
