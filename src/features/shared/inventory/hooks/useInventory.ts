'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import type {
  InventoryListParams,
  AdjustInventoryInput,
  StockInInput,
} from '../types/inventory.types';

export function useInventory(params?: InventoryListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.list(params),
  });

  const stockInMutation = useMutation({
    mutationFn: (data: StockInInput) => inventoryApi.stockIn(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdjustInventoryInput }) =>
      inventoryApi.adjust(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  return {
    inventory: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    stockIn: stockInMutation.mutateAsync,
    adjustInventory: adjustMutation.mutateAsync,
  };
}
