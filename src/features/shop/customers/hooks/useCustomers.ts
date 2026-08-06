'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import type {
  CreateCustomerInput,
  Customer,
  CustomerListParams,
  UpdateCustomerInput,
} from '../types/customers.types';

// An export is of everything matching the current filters, not of the page the
// user happens to be on — a 15-row CSV from a 200-customer book is a bug report
// waiting to happen. Anything beyond this is truncated rather than hanging the
// browser; at that size the list belongs in a report, not a spreadsheet.
const EXPORT_LIMIT = 1000;

/**
 * Paginated customers list plus create/update/deactivate.
 *
 * Selling on credit changes what a customer owes, so the sell flow invalidates
 * ['customers'] too — see stockSyncEngine.
 */
export function useCustomers(params?: CustomerListParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.list(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'all' });
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => customersApi.create(data),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCustomerInput }) =>
      customersApi.update(id, data),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => customersApi.deactivate(id),
    // A customer can only be deactivated once they owe nothing, so their debts
    // are settled by definition — but refresh the ledger anyway since the
    // customer name shown on debt rows comes from this record.
    onSuccess: async () => {
      await invalidate();
      await queryClient.invalidateQueries({ queryKey: ['debts'], refetchType: 'all' });
    },
  });

  /**
   * Every customer matching the active filters, for the CSV export.
   *
   * `fetchQuery` rather than a second `useQuery`: this must run on click, not
   * on render, and it reuses the cache if the same wide page was already
   * fetched. Returns the rows and leaves formatting to the caller.
   */
  async function fetchAllForExport(): Promise<Customer[]> {
    const exportParams = { ...params, page: 1, limit: EXPORT_LIMIT };
    const result = await queryClient.fetchQuery({
      queryKey: ['customers', exportParams],
      queryFn: () => customersApi.list(exportParams),
    });
    return result?.data?.data ?? [];
  }

  const customers: Customer[] = listQuery.data?.data?.data ?? [];
  const total: number = listQuery.data?.data?.total ?? 0;
  const totalPages: number = listQuery.data?.data?.totalPages ?? 1;

  return {
    fetchAllForExport,
    customers,
    total,
    totalPages,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    error: listQuery.error,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deactivateCustomer: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
