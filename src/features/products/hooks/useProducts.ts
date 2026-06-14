'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import type {
  Product,
  ProductDetail,
  ProductListParams,
  UpdateProductInput,
  CreateProductInput,
} from '../types/products.types';
import type { ApiResponse, PaginatedResponse } from '@/common/types/api.types';

export function useProduct(id: number | null) {
  return useQuery<ApiResponse<ProductDetail>>({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id!),
    enabled: id !== null,
  });
}

export function useProducts(params?: ProductListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery<ApiResponse<PaginatedResponse<Product>>>({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: ({ data, shop_id }: { data: CreateProductInput; shop_id?: number }) =>
      productsApi.create(data, shop_id),
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
    // Unwrap ApiResponse → PaginatedResponse
    products: listQuery.data?.data?.data ?? [],
    total: listQuery.data?.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
