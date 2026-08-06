'use client';

import { StatCard, StatCardGrid } from '@/common/components';
import { formatMoneyGrouped } from '@/common/utils/money';
import type { CustomerStats } from '../types/customers.types';

interface CustomerStatsCardsProps {
  stats: CustomerStats;
  isLoading: boolean;
  currency: string;
  /** Jumps the table to the customers who owe money. */
  onWithDebtClick: () => void;
  labels: { total: string; withDebt: string; outstanding: string; openInvoices: string };
}

/**
 * The four numbers a shop owner checks before making collection calls. All are
 * shop-wide — filtering the table below never changes them.
 */
export function CustomerStatsCards({
  stats,
  isLoading,
  currency,
  onWithDebtClick,
  labels,
}: CustomerStatsCardsProps) {
  return (
    <StatCardGrid>
      <StatCard label={labels.total} value={String(stats.totalCustomers)} isLoading={isLoading} />
      <StatCard
        label={labels.withDebt}
        value={String(stats.withDebtCount)}
        tone={stats.withDebtCount > 0 ? 'amber' : 'neutral'}
        isLoading={isLoading}
        onClick={onWithDebtClick}
      />
      <StatCard
        label={labels.outstanding}
        value={formatMoneyGrouped(stats.totalOutstanding)}
        suffix={currency}
        tone="danger"
        isLoading={isLoading}
      />
      <StatCard
        label={labels.openInvoices}
        value={String(stats.openInvoices)}
        isLoading={isLoading}
      />
    </StatCardGrid>
  );
}
