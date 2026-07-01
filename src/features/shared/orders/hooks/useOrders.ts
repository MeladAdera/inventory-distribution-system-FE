'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import type { OrderListParams, UpdateOrderStatusInput } from '../types/orders.types';

export function useOrders(params?: OrderListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'], refetchType: 'all' }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusInput }) =>
      ordersApi.updateStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });

  return {
    orders: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createOrder: createMutation.mutateAsync,
    updateOrderStatus: updateStatusMutation.mutateAsync,
  };
}
