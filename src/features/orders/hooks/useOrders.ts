'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';

export function useOrders() {
  const listQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
  });

  return {
    orders: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createOrder: createMutation.mutateAsync,
  };
}
