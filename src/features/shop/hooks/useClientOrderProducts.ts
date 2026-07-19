'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productsApi } from '@/features/shared/products/api/products.api';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { ordersApi } from '@/features/shared/orders/api/orders.api';
import { categoriesApi } from '@/features/shared/categories/api/categories.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { isAxiosError } from '@/common/utils/error.utils';
import {
  ProductSource,
  StockStatus,
  type DisplayStockStatus,
} from '@/features/shared/products/types/products.types';
import type { Product } from '@/features/shared/products/types/products.types';
import type { InventoryItem } from '@/features/shared/inventory/types/inventory.types';
import type { Category } from '@/features/shared/categories/types/categories.types';
import type { CreateOrderInput } from '@/features/shared/orders/types/orders.types';
import type { OrderableProduct, OrderableCategory } from '../types/clientOrderProducts.types';

function computeStatus(qty: number, isLowStock: boolean, threshold: number): DisplayStockStatus {
  if (qty === 0) return StockStatus.OUT_OF_STOCK;
  if (isLowStock || qty <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.HIGH_STOCK;
}

export function useClientOrderProducts() {
  const queryClient = useQueryClient();
  const shopId = useAuthStore((s) => s.user?.shopId);

  // is_orderable filters out catalog-only listings; stock_status=IN_STOCK filters
  // out products the warehouse is flagged orderable for but currently has 0 of.
  const productsQuery = useQuery({
    queryKey: ['order-products'],
    queryFn: () =>
      productsApi.list({
        source: ProductSource.WAREHOUSE,
        is_orderable: true,
        stock_status: StockStatus.IN_STOCK,
        limit: 100,
      }),
  });

  // Same query key + params as useClientInventory — one shared cache entry for
  // GET /inventory so the order, sell, and inventory pages never drift apart.
  const inventoryQuery = useQuery({
    queryKey: ['client-inventory'],
    queryFn: () => inventoryApi.list({ limit: 100 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['client-inventory-categories', shopId],
    queryFn: () => categoriesApi.list(shopId ? { shopId } : undefined),
    enabled: shopId !== undefined,
  });

  const categories: OrderableCategory[] = useMemo(() => {
    const products: Product[] = productsQuery.data?.data?.data ?? [];
    const invItems: InventoryItem[] = inventoryQuery.data?.data?.data ?? [];
    const cats: Category[] = categoriesQuery.data?.data ?? [];

    const invMap = new Map<number, InventoryItem>(invItems.map((i) => [i.product_id, i]));
    const catMap = new Map<number, Category>(cats.map((c) => [c.id, c]));
    const grouped = new Map<number, OrderableCategory>();

    products.forEach((product) => {
      const inv = invMap.get(product.id);
      const qty = inv?.current_quantity ?? 0;
      const threshold = inv?.low_stock_threshold ?? 0;
      const isLowStock = inv?.is_low_stock ?? false;

      const enriched: OrderableProduct = {
        id: product.id,
        name: product.name,
        category_id: product.category_id,
        category_name: product.category_name,
        price: product.price,
        current_quantity: qty,
        status: computeStatus(qty, isLowStock, threshold),
        image_url: product.image_url,
      };

      if (!grouped.has(product.category_id)) {
        grouped.set(product.category_id, {
          id: product.category_id,
          name: product.category_name,
          icon: catMap.get(product.category_id)?.icon ?? null,
          image_url: catMap.get(product.category_id)?.image_url ?? null,
          products: [],
        });
      }

      grouped.get(product.category_id)!.products.push(enriched);
    });

    return Array.from(grouped.values());
  }, [productsQuery.data, inventoryQuery.data, categoriesQuery.data]);

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderInput) => ordersApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['client-orders'], refetchType: 'all' }),
    onError: (err) => {
      // A 400 (not orderable / out of stock / insufficient stock) means the
      // cached picker list no longer matches the warehouse — refetch it.
      if (isAxiosError(err) && err.response?.status === 400) {
        queryClient.invalidateQueries({ queryKey: ['order-products'] });
      }
    },
  });

  return {
    categories,
    isLoading: productsQuery.isLoading || inventoryQuery.isLoading || categoriesQuery.isLoading,
    error: productsQuery.error ?? inventoryQuery.error ?? categoriesQuery.error,
    createOrder: createMutation.mutateAsync,
    isSubmitting: createMutation.isPending,
  };
}
