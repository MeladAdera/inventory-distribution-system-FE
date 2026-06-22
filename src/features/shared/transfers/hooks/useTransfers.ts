'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from '../api/transfers.api';
import type {
  Transfer,
  TransferListParams,
  CreateTransferInput,
  UpdateTransferStatusInput,
} from '../types/transfers.types';
import type { ApiResponse, PaginatedResponse } from '@/common/types/api.types';
import type { Product } from '@/features/shared/products/types/products.types';
import type { Shop } from '@/features/admin/shops/types/shops.types';

export function useTransfers(params?: TransferListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery<ApiResponse<PaginatedResponse<Transfer>>>({
    queryKey: ['transfers', params],
    queryFn: () => transfersApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTransferInput) => transfersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransferStatusInput }) =>
      transfersApi.updateStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-detail', id] });
    },
  });

  return {
    transfers: listQuery.data?.data?.data ?? [],
    total: listQuery.data?.data?.total ?? 0,
    totalPages: listQuery.data?.data?.totalPages ?? 1,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createTransfer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useTransferShops() {
  return useQuery<ApiResponse<PaginatedResponse<Shop>>>({
    queryKey: ['transfer-shops'],
    queryFn: transfersApi.getShops,
    staleTime: 5 * 60 * 1000,
    select: (data) => data,
  });
}

export function useTransferProducts() {
  return useQuery<ApiResponse<PaginatedResponse<Product>>>({
    queryKey: ['transfer-products'],
    queryFn: transfersApi.getProducts,
    staleTime: 5 * 60 * 1000,
  });
}
