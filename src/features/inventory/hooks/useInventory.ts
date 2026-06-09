'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';

export function useInventory() {
  const listQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: inventoryApi.create,
  });

  return {
    inventory: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createInventory: createMutation.mutateAsync,
  };
}
