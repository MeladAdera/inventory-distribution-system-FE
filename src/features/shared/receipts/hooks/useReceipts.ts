'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '../api/receipts.api';
import type {
  ReceiptListItem,
  Receipt,
  ReceiptListParams,
  CreateReceiptInput,
} from '../types/receipts.types';

export function useReceipts(params?: ReceiptListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['receipts', params],
    queryFn: () => receiptsApi.list(params),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateReceiptInput) => receiptsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts'], refetchType: 'all' }),
  });

  const receipts: ReceiptListItem[] = listQuery.data?.data?.data ?? [];
  const total: number = listQuery.data?.data?.total ?? 0;
  const totalPages: number = listQuery.data?.data?.totalPages ?? 1;

  return {
    receipts,
    total,
    totalPages,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createReceipt: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useReceiptDetail(id: number | null) {
  const query = useQuery({
    queryKey: ['receipts', id],
    queryFn: () => receiptsApi.getById(id!),
    enabled: id !== null,
  });

  const receipt: Receipt | null = query.data?.data ?? null;

  return {
    receipt,
    isLoading: query.isLoading,
    error: query.error,
  };
}
