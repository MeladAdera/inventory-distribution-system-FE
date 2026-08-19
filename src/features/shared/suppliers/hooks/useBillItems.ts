'use client';

import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliers.api';
import type { BillItem } from '../types/suppliers.types';

/**
 * The goods on one bill.
 *
 * Needs the supplier as well as the bill because the route is nested under the
 * supplier — `SupplierBill.supplier_id` carries it, so a row from any list is
 * enough to open this.
 *
 * Pass null for either to keep the query idle while the modal is closed,
 * matching the convention in `useSupplierBill` / `useSupplierDetail`.
 */
export function useBillItems(supplierId: number | null, billId: number | null) {
  const enabled = supplierId !== null && billId !== null;

  const query = useQuery({
    queryKey: ['suppliers', 'bill-items', supplierId, billId],
    queryFn: () => suppliersApi.billItems(supplierId as number, billId as number),
    enabled,
    staleTime: 0,
  });

  const items: BillItem[] = query.data?.data ?? [];

  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    /**
     * Whether this bill moved stock — `null` until we know.
     *
     * The distinction matters: a bill with items cannot be cancelled, and the
     * cancel action is withheld rather than offered-then-refused. Treating
     * "still loading" as "no items" would flash a button that then vanishes,
     * so callers should require an explicit `false`.
     */
    hasItems: query.isSuccess ? items.length > 0 : null,
  };
}
