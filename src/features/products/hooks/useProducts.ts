'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';

export function useProducts() {
  const listQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
  });

  return {
    products: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createProduct: createMutation.mutateAsync,
  };
}
