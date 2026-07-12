'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/admin/users/api/users.api';
import { shopsApi } from '@/features/admin/shops/api/shops.api';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { UpdateUserInput } from '@/features/admin/users/types/users.types';
import type { UpdateShopInput } from '@/features/admin/shops/types/shops.types';

export function useProfileSettings(userId: number) {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const currentUser = useAuthStore((s) => s.user);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserInput) => usersApi.update(userId, data),
    onSuccess: (response) => {
      if (currentUser) {
        setAuth({ ...currentUser, ...response.data });
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useChangePassword() {
  const changeMutation = useMutation({
    mutationFn: authApi.changePassword,
  });

  return {
    changePassword: changeMutation.mutateAsync,
    isChanging: changeMutation.isPending,
  };
}

export function useShopSettings(shopId: number | undefined) {
  const queryClient = useQueryClient();

  const shopQuery = useQuery({
    queryKey: ['shop-settings', shopId],
    queryFn: () => shopsApi.getById(shopId!),
    enabled: !!shopId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateShopInput) => shopsApi.update(shopId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings', shopId] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });

  return {
    shop: shopQuery.data?.data ?? null,
    isLoading: shopQuery.isLoading,
    updateShop: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
