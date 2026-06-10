'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import type {
  CategoryListParams,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/categories.types';

export function useCategories(params?: CategoryListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoriesApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: ({ data, shopId }: { data: CreateCategoryInput; shopId?: number }) =>
      categoriesApi.create(data, shopId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryInput }) =>
      categoriesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return {
    categories: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
  };
}
