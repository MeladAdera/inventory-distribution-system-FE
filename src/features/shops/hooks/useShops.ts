'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../api/shops.api';
import type { ShopListParams, UpdateShopInput, UpdateShopStatusInput } from '../types/shops.types';

export function useShops(params?: ShopListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['shops', params],
    queryFn: () => shopsApi.list(params),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShopInput }) => shopsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shops'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShopStatusInput }) =>
      shopsApi.updateStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shops'] }),
  });

  return {
    shops: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    updateShop: updateMutation.mutateAsync,
    updateShopStatus: updateStatusMutation.mutateAsync,
  };
}
