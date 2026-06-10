'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import type { UpdateUserInput, UserListParams } from '../types/users.types';

export function useUsers(params?: UserListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list(params),
  });

  const createShopOwnerMutation = useMutation({
    mutationFn: usersApi.createShopOwner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: usersApi.createEmployee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) => usersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return {
    users: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createShopOwner: createShopOwnerMutation.mutateAsync,
    createEmployee: createEmployeeMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deactivateUser: deactivateMutation.mutateAsync,
  };
}
