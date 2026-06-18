'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ordersApi } from '@/features/orders/api/orders.api';
import { OrderStatus } from '@/features/orders/types/orders.types';
import type { Order } from '@/features/orders/types/orders.types';
import type { ClientOrder } from '../types/clientOrders.types';

export function useClientOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['client-orders'],
    queryFn: () => ordersApi.list({ limit: 100 }),
  });

  const orders: ClientOrder[] = useMemo(() => {
    const raw: Order[] = ordersQuery.data?.data?.data ?? [];
    return raw.map((o) => ({
      id: o.id,
      status: o.status,
      total_items: o.total_items,
      created_at: o.created_at,
      items: o.items ?? [],
    }));
  }, [ordersQuery.data]);

  const confirmReceivedMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.updateStatus(orderId, { status: OrderStatus.RECEIVED }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) =>
      ordersApi.updateStatus(orderId, { status: OrderStatus.CANCELLED }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
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
