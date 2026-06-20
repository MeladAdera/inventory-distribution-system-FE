'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import type {
  Category,
  CategoryListParams,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/categories.types';
import type { ApiResponse } from '@/common/types/api.types';

export function useCategories(params?: CategoryListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery<ApiResponse<Category[]>>({
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

  const uploadImageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => categoriesApi.uploadImage(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const deleteImageMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteImage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return {
    categories: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    uploadCategoryImage: uploadImageMutation.mutateAsync,
    isUploadingCategoryImage: uploadImageMutation.isPending,
    deleteCategoryImage: deleteImageMutation.mutateAsync,
    isDeletingCategoryImage: deleteImageMutation.isPending,
  };
}
