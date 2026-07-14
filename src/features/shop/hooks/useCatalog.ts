'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/features/shared/products/api/products.api';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { ProductSource } from '@/features/shared/products/types/products.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';
import type { CatalogCategory, CatalogProduct } from '../types/catalog.types';

const CATALOG_KEY = ['catalog'];

interface CatalogEnvelope {
  data?: { data?: CatalogProduct[] };
}

export function useCatalog() {
  const queryClient = useQueryClient();

  // Products with a POST /inventory in flight — drives the per-card spinner
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());

  const catalogQuery = useQuery({
    queryKey: CATALOG_KEY,
    queryFn: () => productsApi.list({ source: ProductSource.WAREHOUSE, limit: 100 }),
  });

  // Patch one item in the cached catalog list in place — cheaper than a refetch,
  // and the idempotent backend makes a stale flag harmless anyway.
  function patchCatalogItem(productId: number, patch: Partial<CatalogProduct>) {
    queryClient.setQueryData(CATALOG_KEY, (prev: CatalogEnvelope | undefined) => {
      if (!prev?.data?.data) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          data: prev.data.data.map((p) => (p.id === productId ? { ...p, ...patch } : p)),
        },
      };
    });
  }

  function invalidateInventory() {
    queryClient.invalidateQueries({ queryKey: ['client-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['client-inventory-products'] });
  }

  const addMutation = useMutation({
    mutationFn: (productId: number) => inventoryApi.add({ productId }),
    onMutate: (productId) => {
      setAddingIds((prev) => new Set(prev).add(productId));
    },
    onSuccess: (res, productId) => {
      const row: InventoryItem | undefined = res?.data;
      patchCatalogItem(productId, {
        in_inventory: true,
        current_quantity: row?.current_quantity ?? 0,
      });
      invalidateInventory();
    },
    onSettled: (_res, _err, productId) => {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    },
  });

  // Opening balance for a just-added row — a plain adjustment on the new
  // inventory row, so it flows through the same audit trail as any stock edit.
  const openingStockMutation = useMutation({
    mutationFn: ({
      inventoryId,
      quantity,
    }: {
      productId: number;
      inventoryId: number;
      quantity: number;
    }) => inventoryApi.adjust(inventoryId, { adjustment: quantity, reason: 'Opening stock' }),
    onSuccess: (res, { productId, quantity }) => {
      const row: InventoryItem | undefined = res?.data;
      patchCatalogItem(productId, { current_quantity: row?.current_quantity ?? quantity });
      invalidateInventory();
    },
  });

  const { categories, isEmpty } = useMemo(() => {
    const items: CatalogProduct[] = catalogQuery.data?.data?.data ?? [];
    const grouped = new Map<string, CatalogProduct[]>();
    items.forEach((p) => {
      const name = p.category_name ?? 'General';
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(p);
    });
    const cats: CatalogCategory[] = Array.from(grouped, ([name, prods]) => ({
      name,
      // category_icon travels on every product row, so no separate category fetch.
      icon: prods[0].category_icon ?? null,
      items: prods,
    }));
    return { categories: cats, isEmpty: items.length === 0 };
  }, [catalogQuery.data]);

  return {
    categories,
    isEmpty,
    isLoading: catalogQuery.isLoading,
    error: catalogQuery.error,
    addingIds,
    /** Resolves with the created (or pre-existing) inventory row. */
    addToInventory: async (productId: number): Promise<InventoryItem | undefined> => {
      const res = await addMutation.mutateAsync(productId);
      return res?.data;
    },
    setOpeningStock: openingStockMutation.mutateAsync,
    isSettingStock: openingStockMutation.isPending,
  };
}
