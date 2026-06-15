import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { TopProduct } from '../types/analytics.types';

export function useTopProducts(limit = 5) {
  const query = useQuery({
    queryKey: ['analytics', 'top-products', limit],
    queryFn: () => analyticsApi.topProducts(limit),
    staleTime: 5 * 60 * 1000,
  });

  const items: TopProduct[] = query.data?.data ?? [];

  return {
    topProducts: items,
    isLoading: query.isLoading,
  };
}
