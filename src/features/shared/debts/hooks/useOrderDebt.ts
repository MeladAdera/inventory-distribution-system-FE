'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { debtsApi } from '../api/debts.api';
import type { Debt } from '../types/debts.types';

// A debt is created when an order ships unpaid, so before shipping there is
// nothing to ask about. Skipping the request here keeps the detail modal from
// firing a guaranteed 404 every time someone opens a new order.
const PRE_SHIPMENT: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
]);

/**
 * The debt attached to one order — what a shop still owes the warehouse.
 *
 * `GET /orders/:id/debt` answers 404 for "nothing owed": the order was paid in
 * full, or never shipped. That is an empty state, not a failure, so it resolves
 * to null and `error` stays clear. Retries are off because a 404 here is a
 * settled answer, not a blip worth asking about three times.
 *
 * Pass null to keep the query idle while the modal is closed.
 */
export function useOrderDebt(orderId: number | null, orderStatus?: OrderStatus) {
  const enabled = orderId !== null && !(orderStatus !== undefined && PRE_SHIPMENT.has(orderStatus));

  const query = useQuery({
    // Nested under 'debts' so recording or reversing a payment — both of which
    // invalidate ['debts'] — refreshes this block without naming it.
    queryKey: ['debts', 'order', orderId],
    queryFn: async () => {
      try {
        return await debtsApi.getOrderDebt(orderId as number);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled,
    staleTime: 0,
    retry: false,
  });

  const debt = (query.data?.data as Debt) ?? null;

  return {
    debt,
    /** The order is settled or never accrued a debt — distinct from "not asked yet". */
    nothingOwed: query.isSuccess && debt === null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
