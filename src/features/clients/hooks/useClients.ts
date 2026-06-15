'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '@/features/shops/api/shops.api';
import { usersApi } from '@/features/users/api/users.api';
import { ShopType } from '@/features/shops/types/shops.types';
import type { Shop, UpdateShopInput } from '@/features/shops/types/shops.types';
import type { CreateShopOwnerInput } from '@/features/users/types/users.types';
import type { AdminClient } from '../types/clients.types';

interface ClientListParams {
  page: number;
  limit: number;
  search?: string;
}

function shopToClient(s: Shop): AdminClient {
  return {
    id: s.id,
    name_ar: s.name,
    name_en: s.name,
    phone: s.phone ?? '—',
    city_ar: s.address ?? '—',
    city_en: s.address ?? '—',
    product_count: 0,
    last_activity_ar: '—',
    last_activity_en: '—',
    status: s.is_active ? 'active' : 'inactive',
  };
}

export function useClients(params: ClientListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['shops', { ...params, type: ShopType.SHOP }],
    queryFn: () => shopsApi.list({ ...params, type: ShopType.SHOP }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateShopOwnerInput) => usersApi.createShopOwner(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shops'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShopInput }) => shopsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shops'] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      shopsApi.updateStatus(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shops'] }),
  });

  const shopsRaw = listQuery.data?.data;

  const shopsList: Shop[] = useMemo(() => {
    if (!shopsRaw) return [];
    if (Array.isArray(shopsRaw)) return shopsRaw;
    return (shopsRaw as { data?: Shop[] }).data ?? [];
  }, [shopsRaw]);

  const total: number = Array.isArray(shopsRaw)
    ? shopsRaw.length
    : ((shopsRaw as { total?: number })?.total ?? 0);

  const clients = useMemo(() => shopsList.map(shopToClient), [shopsList]);

  return {
    clients,
    total,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createShopOwner: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateShop: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isTogglingStatus: toggleStatusMutation.isPending,
  };
}
