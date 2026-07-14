'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/shared/products/api/products.api';
import { shopsApi } from '@/features/admin/shops/api/shops.api';
import { ordersApi } from '@/features/shared/orders/api/orders.api';
import { inventoryApi } from '@/features/shared/inventory/api/inventory.api';
import { ShopType } from '@/features/admin/shops/types/shops.types';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';

const STALE = 60 * 1000;

// The shops endpoint may return a flat array or a paginated wrapper
function extractShopsTotal(data: unknown): number {
  if (!data) return 0;
  const inner = (data as { data?: unknown }).data;
  if (Array.isArray(inner)) return inner.length;
  if (inner && typeof inner === 'object') {
    return (inner as { total?: number; length?: number }).total ?? 0;
  }
  return 0;
}

export function useDashboardStats() {
  // Orderable = products the warehouse actually stocks/fulfills; catalog-only
  // templates are counted separately so the headline number stays honest.
  const productsQ = useQuery({
    queryKey: ['dashboard', 'products-total', { is_orderable: true }],
    queryFn: () => productsApi.list({ is_orderable: true, limit: 1 }),
    staleTime: STALE,
  });

  const catalogQ = useQuery({
    queryKey: ['dashboard', 'products-total', { is_orderable: false }],
    queryFn: () => productsApi.list({ is_orderable: false, limit: 1 }),
    staleTime: STALE,
  });

  const shopsQ = useQuery({
    queryKey: ['dashboard', 'shops-total'],
    queryFn: () => shopsApi.list({ type: ShopType.SHOP, limit: 100 }),
    staleTime: STALE,
  });

  const pendingQ = useQuery({
    queryKey: ['dashboard', 'pending-orders'],
    queryFn: () => ordersApi.list({ status: OrderStatus.PENDING, limit: 1 }),
    staleTime: STALE,
  });

  const lowStockQ = useQuery({
    queryKey: ['dashboard', 'low-stock-count'],
    queryFn: () => inventoryApi.list({ lowStock: true, limit: 1 }),
    staleTime: STALE,
  });

  const totalOrdersQ = useQuery({
    queryKey: ['dashboard', 'total-orders'],
    queryFn: () => ordersApi.list({ limit: 1 }),
    staleTime: STALE,
  });

  const completedQ = useQuery({
    queryKey: ['dashboard', 'completed-orders'],
    queryFn: () => ordersApi.list({ status: OrderStatus.COMPLETED, limit: 1 }),
    staleTime: STALE,
  });

  return {
    totalProducts: productsQ.data?.data?.total ?? 0,
    catalogProducts: catalogQ.data?.data?.total ?? 0,
    totalShops: extractShopsTotal(shopsQ.data),
    pendingOrders: pendingQ.data?.data?.total ?? 0,
    lowStockItems: lowStockQ.data?.data?.total ?? 0,
    totalOrders: totalOrdersQ.data?.data?.total ?? 0,
    completedOrders: completedQ.data?.data?.total ?? 0,
    isLoading:
      productsQ.isLoading ||
      catalogQ.isLoading ||
      shopsQ.isLoading ||
      pendingQ.isLoading ||
      lowStockQ.isLoading ||
      totalOrdersQ.isLoading ||
      completedQ.isLoading,
  };
}
