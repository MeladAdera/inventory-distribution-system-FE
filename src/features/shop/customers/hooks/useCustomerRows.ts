'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isPositiveMoney, parseMoney } from '@/common/utils/money';
import { debtsApi, DebtStatus, DebtorType } from '@/features/shared/debts';
import type { DebtListItem, DebtListParams } from '@/features/shared/debts';
import { CustomerSort } from '../types/customers.types';
import type { Customer, CustomerRow } from '../types/customers.types';

// Module-level so the query key stays referentially stable across renders.
//
// The 200 cap mirrors the one on the warehouse side of the ledger: a shop
// carrying more than 200 unpaid sales at once would need pagination here. It
// only bounds the *aging* label — the money totals come from /debts/summary,
// which counts everything, so an overflow costs a hint, never a wrong balance.
const CUSTOMER_DEBTS: DebtListParams = { debtorType: DebtorType.CUSTOMER, limit: 200 };

const DAY_MS = 86_400_000;

/** Whole days since the debt was created — the same clock the aging buckets use. */
function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

/**
 * List rows enriched with how old each customer's oldest unpaid sale is, in the
 * requested order.
 *
 * The age is what turns a balance into something actionable — "owes 1,952" and
 * "owes 1,952, oldest sale 42 days ago" call for different phone calls. The
 * customer record doesn't carry it, so it is resolved from the debts ledger
 * once for the whole page rather than per row.
 *
 * Sorting is client-side over the page the table already has: `GET /customers`
 * takes no sort parameter, so this reorders the visible rows, and the footer
 * says as much rather than implying the whole book was ranked.
 */
export function useCustomerRows(customers: Customer[], sort: CustomerSort) {
  const query = useQuery({
    queryKey: ['debts', 'list', CUSTOMER_DEBTS],
    queryFn: () => debtsApi.list(CUSTOMER_DEBTS),
    staleTime: 0,
  });

  const debts: DebtListItem[] = useMemo(() => query.data?.data?.data ?? [], [query.data]);

  // customer_id → age of their oldest sale that still carries a balance.
  const ageByCustomer = useMemo(() => {
    const oldest = new Map<number, string>();
    for (const debt of debts) {
      if (debt.customer_id == null) continue;
      if (debt.status === DebtStatus.CANCELLED) continue;
      if (!isPositiveMoney(debt.remaining)) continue;

      const current = oldest.get(debt.customer_id);
      if (!current || debt.created_at < current) oldest.set(debt.customer_id, debt.created_at);
    }

    const ages = new Map<number, number>();
    oldest.forEach((iso, customerId) => ages.set(customerId, ageInDays(iso)));
    return ages;
  }, [debts]);

  const rows: CustomerRow[] = useMemo(() => {
    const enriched = customers.map((customer) => ({
      ...customer,
      oldest_debt_age_days: ageByCustomer.get(customer.id) ?? null,
    }));

    // Settled customers always sink to the bottom of the debt-driven orders —
    // a list headed "who owes the most" shouldn't open with people owing zero.
    const byDebt = (a: CustomerRow, b: CustomerRow) =>
      parseMoney(b.total_remaining) - parseMoney(a.total_remaining);

    switch (sort) {
      case CustomerSort.OLDEST_DEBT:
        return enriched.sort((a, b) => {
          if (a.oldest_debt_age_days === b.oldest_debt_age_days) return byDebt(a, b);
          if (a.oldest_debt_age_days === null) return 1;
          if (b.oldest_debt_age_days === null) return -1;
          return b.oldest_debt_age_days - a.oldest_debt_age_days;
        });
      case CustomerSort.NEWEST:
        return enriched.sort((a, b) => b.created_at.localeCompare(a.created_at));
      case CustomerSort.NAME:
        return enriched.sort((a, b) => a.name.localeCompare(b.name));
      case CustomerSort.DEBT_DESC:
      default:
        return enriched.sort(byDebt);
    }
  }, [customers, ageByCustomer, sort]);

  // No loading flag: until the ledger answers every age is null, which the row
  // already renders as "age unknown" rather than as a wrong hint.
  return { rows };
}
