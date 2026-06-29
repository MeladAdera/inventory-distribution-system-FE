import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type { ShopConsumptionItem, ShopConsumptionParams } from '../types/analytics.types';

export function useShopConsumption(params: ShopConsumptionParams, enabled = true) {
  const query = useQuery({
    queryKey: ['analytics', 'shop-consumption', params],
    queryFn: () => analyticsApi.shopConsumption(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  });

  const paginated = query.data?.data;
  const items: ShopConsumptionItem[] = paginated?.data ?? [];

  return {
    items,
    total: paginated?.total ?? 0,
    totalPages: paginated?.totalPages ?? 0,
    hasNext: paginated?.hasNext ?? false,
    hasPrev: paginated?.hasPrev ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
