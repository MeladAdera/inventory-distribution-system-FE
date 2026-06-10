'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import type { ProductListParams, UpdateProductInput } from '../types/products.types';

export function useProducts(params?: ProductListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: ({
      data,
      shop_id,
    }: {
      data: Parameters<typeof productsApi.create>[0];
      shop_id?: number;
    }) => productsApi.create(data, shop_id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductInput }) =>
      productsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  return {
    products: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
  };
}
