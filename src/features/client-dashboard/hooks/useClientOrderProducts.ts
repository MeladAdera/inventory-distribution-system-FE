'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productsApi } from '@/features/products/api/products.api';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import { ordersApi } from '@/features/orders/api/orders.api';
import { ProductSource, StockStatus } from '@/features/products/types/products.types';
import type { Product } from '@/features/products/types/products.types';
import type { InventoryItem } from '@/features/inventory/types/inventory.types';
import type { CreateOrderInput } from '@/features/orders/types/orders.types';
import type { OrderableProduct, OrderableCategory } from '../types/clientOrderProducts.types';

function computeStatus(qty: number, isLowStock: boolean, threshold: number): StockStatus {
  if (qty === 0) return StockStatus.OUT_OF_STOCK;
  if (isLowStock || qty <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.HIGH_STOCK;
}

export function useClientOrderProducts() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['order-products'],
    queryFn: () => productsApi.list({ source: ProductSource.WAREHOUSE, limit: 100 }),
  });

  const inventoryQuery = useQuery({
    queryKey: ['order-inventory'],
    queryFn: () => inventoryApi.list({ limit: 100 }),
  });

  const categories: OrderableCategory[] = useMemo(() => {
    const products: Product[] = productsQuery.data?.data?.data ?? [];
    const invItems: InventoryItem[] = inventoryQuery.data?.data?.data ?? [];

    const invMap = new Map<number, InventoryItem>(invItems.map((i) => [i.product_id, i]));
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
      };

      if (!grouped.has(product.category_id)) {
        grouped.set(product.category_id, {
          id: product.category_id,
          name: product.category_name,
          products: [],
        });
      }

      grouped.get(product.category_id)!.products.push(enriched);
    });

    return Array.from(grouped.values());
  }, [productsQuery.data, inventoryQuery.data]);

  const createMutation = useMutation({
    mutationFn: (data: CreateOrderInput) => ordersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-orders'] }),
  });

  return {
    categories,
    isLoading: productsQuery.isLoading || inventoryQuery.isLoading,
    error: productsQuery.error ?? inventoryQuery.error,
    createOrder: createMutation.mutateAsync,
    isSubmitting: createMutation.isPending,
  };
}
