'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../api/shops.api';
import { ShopType } from '../types/shops.types';
import type {
  Shop,
  ShopListParams,
  UpdateShopInput,
  UpdateShopStatusInput,
} from '../types/shops.types';

export function useShops(params?: ShopListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['shops', params],
    queryFn: () => shopsApi.list(params),
  });

  /**
   * The shops a picker may offer as a scope right now.
   *
   * GET /shops has no is_active filter (see ShopListParams), so deactivated
   * shops always come back and have to be dropped here. The warehouse is
   * dropped too: passing `type=SHOP` does not reliably exclude it, and every
   * picker already renders the warehouse as its own "nothing selected" option,
   * so letting it through lists it twice.
   */
  const selectableShops: Shop[] = useMemo(() => {
    const all: Shop[] = listQuery.data?.data ?? [];
    return all.filter((s) => s.is_active && s.type === ShopType.SHOP);
  }, [listQuery.data]);

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
    selectableShops,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    updateShop: updateMutation.mutateAsync,
    updateShopStatus: updateStatusMutation.mutateAsync,
  };
}
