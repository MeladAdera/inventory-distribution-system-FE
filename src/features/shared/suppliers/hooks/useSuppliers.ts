'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers.api';
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListParams,
  UpdateSupplierInput,
} from '../types/suppliers.types';

// An export is of everything matching the current filters, not of the page the
// user happens to be on. Mirrors the customers list — see useCustomers.
const EXPORT_LIMIT = 1000;

/**
 * Paginated suppliers list plus create/update/deactivate.
 *
 * Recording or paying a bill changes what a supplier is owed, so those flows
 * invalidate ['suppliers'] as well — the balance on each row comes from here.
 */
export function useSuppliers(params?: SupplierListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => suppliersApi.list(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['suppliers'], refetchType: 'all' });
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierInput) => suppliersApi.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplierInput }) =>
      suppliersApi.update(id, data),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.deactivate(id),
    // A supplier can only be deactivated once nothing is owed them, so the
    // payables totals are unaffected — but the header cards count suppliers as
    // well as money, and one just left the list.
    onSuccess: async () => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ['analytics'], refetchType: 'all' });
    },
  });

  /**
   * Every supplier matching the active filters, for the CSV export.
   *
   * `fetchQuery` rather than a second `useQuery`: this must run on click, not on
   * render, and it reuses the cache if the same wide page was already fetched.
   */
  async function fetchAllForExport(): Promise<Supplier[]> {
    const exportParams = { ...params, page: 1, limit: EXPORT_LIMIT };
    const result = await queryClient.fetchQuery({
      queryKey: ['suppliers', exportParams],
      queryFn: () => suppliersApi.list(exportParams),
    });
    return result?.data?.data ?? [];
  }

  const suppliers: Supplier[] = listQuery.data?.data?.data ?? [];

  return {
    fetchAllForExport,
    suppliers,
    total: (listQuery.data?.data?.total as number) ?? 0,
    totalPages: (listQuery.data?.data?.totalPages as number) ?? 1,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    createSupplier: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSupplier: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deactivateSupplier: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
