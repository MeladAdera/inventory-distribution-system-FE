'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { productsApi } from '@/features/shared/products/api/products.api';
import { categoriesApi } from '@/features/shared/categories/api/categories.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StockStatus } from '@/features/shared/products/types/products.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';
import type { Product } from '@/features/shared/products/types/products.types';
import type { Category } from '@/features/shared/categories/types/categories.types';
import type { EnrichedInventoryItem, InventoryCategory } from '../types/clientInventory.types';

function computeStatus(qty: number, isLowStock: boolean, threshold: number): StockStatus {
  if (qty === 0) return StockStatus.OUT_OF_STOCK;
  if (isLowStock || qty <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.HIGH_STOCK;
}

export function useClientInventory() {
  const shopId = useAuthStore((s) => s.user?.shopId);

  const inventoryQuery = useQuery({
    queryKey: ['client-inventory'],
    queryFn: () => inventoryApi.list({ limit: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['client-inventory-products'],
    queryFn: () => productsApi.list({ limit: 100 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['client-inventory-categories', shopId],
    queryFn: () => categoriesApi.list(shopId ? { shopId } : undefined),
    enabled: shopId !== undefined,
  });

  const { categories, allItems } = useMemo(() => {
    const invItems: InventoryItem[] = inventoryQuery.data?.data?.data ?? [];
    const products: Product[] = productsQuery.data?.data?.data ?? [];
    const rawCategories: Category[] = categoriesQuery.data?.data ?? [];

    const productMap = new Map<number, Product>(products.map((p) => [p.id, p]));
    const catMap = new Map<number, Category>(rawCategories.map((c) => [c.id, c]));
    const grouped = new Map<number, InventoryCategory>();

    invItems.forEach((item) => {
      const product = productMap.get(item.product_id);
      const categoryName: string = product?.category_name ?? 'General';
      const categoryId: number = product?.category_id ?? 0;
      const qty: number = item.current_quantity ?? 0;
      const threshold: number = item.low_stock_threshold ?? 0;

      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          id: String(categoryId),
          name: categoryName,
          image_url: catMap.get(categoryId)?.image_url ?? null,
          items: [],
        });
      }

      const enriched: EnrichedInventoryItem = {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name ?? product?.name ?? 'Unknown',
        barcode: product?.barcode ?? undefined,
        current_quantity: qty,
        low_stock_threshold: threshold,
        is_low_stock: item.is_low_stock ?? false,
        status: computeStatus(qty, item.is_low_stock ?? false, threshold),
        category_id: categoryId,
        category_name: categoryName,
        updated_at: item.updated_at,
        image_url: product?.image_url ?? null,
      };

      grouped.get(categoryId)!.items.push(enriched);
    });

    const groupedCategories = Array.from(grouped.values());
    return { categories: groupedCategories, allItems: groupedCategories.flatMap((c) => c.items) };
  }, [inventoryQuery.data, productsQuery.data, categoriesQuery.data]);

  return {
    categories,
    allItems,
    isLoading: inventoryQuery.isLoading || productsQuery.isLoading,
    error: inventoryQuery.error ?? productsQuery.error,
  };
}
