'use client';

import { StatCard, StatCardGrid } from '@/common/components';
import { formatMoneyGrouped } from '@/common/utils/money';
import type { SupplierStats } from '../types/suppliers.types';

interface SupplierStatsCardsProps {
  stats: SupplierStats;
  isLoading: boolean;
  currency: string;
  /** Jumps the table to the suppliers still owed money. */
  onWithDebtClick: () => void;
  labels: { total: string; withDebt: string; owed: string; openBills: string };
}

/**
 * The four numbers a shop owner checks before settling up with suppliers. All
 * are shop-wide — filtering the table below never changes them.
 */
export function SupplierStatsCards({
  stats,
  isLoading,
  currency,
  onWithDebtClick,
  labels,
}: SupplierStatsCardsProps) {
  return (
    <StatCardGrid>
      <StatCard label={labels.total} value={String(stats.totalSuppliers)} isLoading={isLoading} />
      <StatCard
        label={labels.withDebt}
        value={String(stats.withDebtCount)}
        tone={stats.withDebtCount > 0 ? 'amber' : 'neutral'}
        isLoading={isLoading}
        onClick={onWithDebtClick}
      />
      <StatCard
        label={labels.owed}
        value={formatMoneyGrouped(stats.totalOwed)}
        suffix={currency}
        tone="danger"
        isLoading={isLoading}
      />
      <StatCard label={labels.openBills} value={String(stats.openBills)} isLoading={isLoading} />
    </StatCardGrid>
  );
}
