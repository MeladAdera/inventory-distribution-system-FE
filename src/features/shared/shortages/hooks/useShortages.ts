'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { shopsApi } from '@/features/admin/shops/api/shops.api';
import { ShopType } from '@/features/admin/shops/types/shops.types';
import type { Shop } from '@/features/admin/shops/types/shops.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';
import type { Shortage, ShortageClient } from '../types/shortages.types';

export function useShortages() {
  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.list({ lowStock: true, limit: 100 }),
  });

  const shopsQuery = useQuery({
    queryKey: ['shops', { type: ShopType.SHOP, limit: 100 }],
    queryFn: () => shopsApi.list({ type: ShopType.SHOP, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Shops endpoint may return a flat array or a paginated wrapper — handle both
  const shopsList: Shop[] = useMemo(() => {
    const raw = shopsQuery.data?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return (raw as { data?: Shop[] }).data ?? [];
  }, [shopsQuery.data]);

  const shopMap = useMemo(() => new Map(shopsList.map((s) => [s.id, s.name])), [shopsList]);

  const clients: ShortageClient[] = useMemo(
    () =>
      shopsList.map((s) => ({
        id: s.id,
        name_ar: s.name,
        name_en: s.name,
      })),
    [shopsList]
  );

  const shortages: Shortage[] = useMemo(() => {
    const items: InventoryItem[] = inventoryQuery.data?.data?.data ?? [];
    return items.map((item) => {
      const shopName = shopMap.get(item.shop_id) ?? `Shop #${item.shop_id}`;
      const isOut = item.current_quantity === 0;
      const suggested = Math.max(item.low_stock_threshold - item.current_quantity, 1);
      return {
        id: item.id,
        client_id: item.shop_id,
        client_name_ar: shopName,
        client_name_en: shopName,
        product_id: item.product_id,
        product_name_ar: item.product_name ?? `Product #${item.product_id}`,
        product_name_en: item.product_name ?? `Product #${item.product_id}`,
        remaining: item.current_quantity,
        min_level: item.low_stock_threshold,
        status: isOut ? 'out' : 'low',
        suggested,
      };
    });
  }, [inventoryQuery.data, shopMap]);

  return {
    shortages,
    clients,
    shops: shopsList,
    isLoading: inventoryQuery.isLoading || shopsQuery.isLoading,
    error: inventoryQuery.error,
  };
}
