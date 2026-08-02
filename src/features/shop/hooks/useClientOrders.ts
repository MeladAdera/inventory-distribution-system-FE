'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ordersApi } from '@/features/shared/orders/api/orders.api';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import type { Order } from '@/features/shared/orders/types/orders.types';
import type { ClientOrder } from '../types/clientOrders.types';

/** `GET /orders` omits line items — only the detail response carries them. */
function toClientOrder(o: Order): ClientOrder {
  return {
    id: o.id,
    status: o.status,
    total_items: o.total_items,
    total_price: o.total_price,
    created_at: o.created_at,
    items: o.items ?? [],
  };
}

/**
 * One order with its line items. Pass null to keep the query idle while the
 * modal that needs it is closed.
 *
 * Shared by the orders page and the debts page, which both open the same modal —
 * one to act on the order, the other to explain a debt. The key stays
 * `['order-detail', id]` so the invalidations in `useClientOrders` still land.
 */
export function useClientOrderDetail(orderId: number | null) {
  const query = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => ordersApi.getById(orderId as number),
    enabled: orderId !== null,
  });

  const order = useMemo((): ClientOrder | null => {
    const o: Order | undefined = query.data?.data;
    return o ? toClientOrder(o) : null;
  }, [query.data]);

  return { order, isLoading: query.isLoading };
}

export function useClientOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['client-orders'],
    queryFn: () => ordersApi.list({ limit: 100 }),
  });

  const orders: ClientOrder[] = useMemo(() => {
    const raw: Order[] = ordersQuery.data?.data?.data ?? [];
    return raw.map(toClientOrder);
  }, [ordersQuery.data]);

  const confirmReceivedMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.updateStatus(orderId, { status: OrderStatus.RECEIVED }),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    },
  });

  return {
    orders,
    total: (ordersQuery.data?.data?.total ?? 0) as number,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    confirmReceived: confirmReceivedMutation.mutateAsync,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isConfirming: confirmReceivedMutation.isPending,
    isCancelling: cancelOrderMutation.isPending,
  };
}
