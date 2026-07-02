'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';

export interface AdminInventoryStats {
  totalSKUs: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function useAdminInventory() {
  const queryClient = useQueryClient();
  const shopId = useAuthStore((s) => s.user?.shopId);

  const inventoryQuery = useQuery({
    queryKey: ['admin-inventory', 'all', shopId],
    queryFn: () => inventoryApi.list({ limit: 9999, shop_id: shopId }),
    enabled: shopId !== undefined,
    staleTime: 0,
  });

  const items: InventoryItem[] = useMemo(
    () => inventoryQuery.data?.data?.data ?? [],
    [inventoryQuery.data]
  );

  const stats: AdminInventoryStats = useMemo(() => {
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      totalUnits += item.current_quantity;
      if (item.current_quantity === 0) outOfStockCount++;
      else if (item.is_low_stock || item.current_quantity <= item.low_stock_threshold)
        lowStockCount++;
    }

    return { totalSKUs: items.length, totalUnits, lowStockCount, outOfStockCount };
  }, [items]);

  const stockInMutation = useMutation({
    mutationFn: inventoryApi.stockIn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-inventory'] }),
  });

  return {
    items,
    stats,
    isLoading: inventoryQuery.isLoading,
    error: inventoryQuery.error,
    stockIn: stockInMutation.mutateAsync,
    isStockingIn: stockInMutation.isPending,
  };
}
