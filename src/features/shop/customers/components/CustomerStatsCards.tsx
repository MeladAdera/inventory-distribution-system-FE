'use client';

import { formatMoneyGrouped } from '@/common/utils/money';
import { cn } from '@/common/utils/cn';
import type { CustomerStats } from '../types/customers.types';

interface CustomerStatsCardsProps {
  stats: CustomerStats;
  isLoading: boolean;
  currency: string;
  /** Jumps the table to the customers who owe money. */
  onWithDebtClick: () => void;
  labels: { total: string; withDebt: string; outstanding: string; openInvoices: string };
}

function StatCard({
  label,
  value,
  suffix,
  tone = 'neutral',
  isLoading,
  onClick,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: 'neutral' | 'amber' | 'danger';
  isLoading: boolean;
  onClick?: () => void;
}) {
  const toneClass =
    tone === 'danger' ? 'text-danger-700' : tone === 'amber' ? 'text-amber-700' : 'text-ink-900';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'bg-paper border border-border rounded-xl px-4 py-3.5 sm:px-5 sm:py-4',
        onClick &&
          'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-sm'
      )}
    >
      <p className="text-[12px] font-medium text-ink-500">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-7 w-20 rounded skeleton-shimmer" />
      ) : (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-mono text-[22px] sm:text-[26px] font-bold leading-tight tabular-nums',
              toneClass
            )}
          >
            {value}
          </span>
          {suffix && <span className="text-[12px] text-ink-400">{suffix}</span>}
        </p>
      )}
    </div>
  );
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
    </div>
  );
}
