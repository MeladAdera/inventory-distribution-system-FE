'use client';

import { useMemo } from 'react';
import { parseMoney } from '@/common/utils/money';
import { SupplierSort } from '../types/suppliers.types';
import type { Supplier } from '../types/suppliers.types';

/**
 * The loaded page in the requested order.
 *
 * Sorting is client-side over the page the table already has: `GET /suppliers`
 * takes no sort parameter, so this reorders the visible rows, and the footer
 * says as much rather than implying the whole book was ranked.
 *
 * Unlike `useCustomerRows` this fetches nothing. The customers list enriches
 * each row with the age of its oldest unpaid sale, read in one call from
 * `GET /debts`; payables have no such list endpoint — bills are readable only
 * one supplier at a time — so an age hint would cost one request per row.
 */
export function useSupplierRows(suppliers: Supplier[], sort: SupplierSort) {
  const rows = useMemo(() => {
    // Settled suppliers sink to the bottom of the debt-driven order — a list
    // headed "who you owe most" shouldn't open with the people owed nothing.
    const byDebt = (a: Supplier, b: Supplier) =>
      parseMoney(b.total_remaining) - parseMoney(a.total_remaining);

    const ordered = [...suppliers];

    switch (sort) {
      case SupplierSort.NEWEST:
        return ordered.sort((a, b) => b.created_at.localeCompare(a.created_at));
      case SupplierSort.NAME:
        return ordered.sort((a, b) => a.name.localeCompare(b.name));
      case SupplierSort.DEBT_DESC:
      default:
        return ordered.sort(byDebt);
    }
  }, [suppliers, sort]);

  return { rows };
}
