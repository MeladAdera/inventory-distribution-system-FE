'use client';

import { useState } from 'react';
import { Banknote, Wallet, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { KpiCard } from '@/features/admin/dashboard/components/KpiCard';
import { CardShell } from '@/features/admin/dashboard/components/CardShell';
import { useProfitSummary } from '../hooks/useProfitSummary';
import { useProfitTrend } from '../hooks/useProfitTrend';
import type { TrendPeriod } from '../types/analytics.types';
import { ProfitShopSelect } from './ProfitShopSelect';
import { ProfitTrendChart } from './ProfitTrendChart';

interface ProfitDashboardPageProps {
  /** Admin gets the shop scope selector; shop owners are auto-scoped by the API */
  isAdmin: boolean;
}

export function ProfitDashboardPage({ isAdmin }: ProfitDashboardPageProps) {
  const { t, locale } = useI18n();
  const pr = t.profit;

  const [period, setPeriod] = useState<TrendPeriod>('daily');
  const [shopId, setShopId] = useState<number | undefined>(undefined);

  const params = { period, ...(isAdmin && shopId ? { shopId } : {}) };
  const { summary, isLoading: summaryLoading } = useProfitSummary(params);
  const { trend, isLoading: trendLoading, isFetching: trendFetching } = useProfitTrend(params);

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';
  const formatMoney = (n: number) =>
    `${pr.currency} ${n.toLocaleString(localeCode, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const val = (n: number) => (summaryLoading ? '—' : formatMoney(n));

  const periods: TrendPeriod[] = ['daily', 'weekly', 'monthly'];
  const periodLabels: Record<TrendPeriod, string> = {
    daily: pr.period.daily,
    weekly: pr.period.weekly,
    monthly: pr.period.monthly,
  };

  const statCards = [
    {
      icon: Banknote,
      iconBg: 'bg-ink-900',
      iconColor: 'text-amber-500',
      label: pr.cards.revenue,
      value: val(summary.revenue),
      sub: pr.cards.revenueSub,
    },
    {
      icon: Wallet,
      iconBg: 'bg-info-100',
      iconColor: 'text-info-700',
      label: pr.cards.cost,
      value: val(summary.cost),
      sub: pr.cards.costSub,
    },
    {
      icon: TrendingUp,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-700',
      label: pr.cards.profit,
      value: val(summary.profit),
      sub: pr.cards.profitSub,
    },
  ];

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-px h-3.5 bg-ink-700" />
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-600">
              {pr.header.eyebrow}
            </span>
          </div>
          <h1
            className="mt-1.5 text-[26px] font-medium leading-tight tracking-[-0.01em] text-ink-900"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {pr.header.title}
          </h1>
        </div>

        {/* ── Scope + period controls ── */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <ProfitShopSelect
              value={shopId}
              warehouseLabel={pr.scope.warehouse}
              onChange={setShopId}
            />
          )}

          <div className="inline-flex items-center bg-sand-100 border border-border rounded-full p-0.75 gap-0.5">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={p === period}
                className={cn(
                  'text-[13px] font-medium px-3.5 py-1.25 rounded-full transition-all duration-150',
                  p === period
                    ? 'bg-paper text-ink-900 shadow-(--shadow-xs)'
                    : 'text-ink-500 hover:text-ink-700'
                )}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
        {statCards.map((card) => (
          <KpiCard
            key={card.label}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            label={card.label}
            value={card.value}
            sub={card.sub}
          />
        ))}
      </div>

      {/* Pre-feature transactions have cost 0, so old periods overstate profit */}
      <p className="flex items-center gap-1.5 text-xs text-ink-400 mb-6">
        <Info size={13} className="shrink-0" />
        {pr.cards.legacyNote}
      </p>

      {/* ── Trend chart ── */}
      <CardShell title={pr.chart.title} noPadding>
        <div className="px-5 py-4">
          <ProfitTrendChart
            points={trend}
            isLoading={trendLoading}
            isFetching={trendFetching}
            localeCode={localeCode}
            labels={{
              revenue: pr.chart.revenue,
              cost: pr.chart.cost,
              profit: pr.chart.profit,
              empty: pr.chart.empty,
            }}
            formatMoney={formatMoney}
          />
        </div>
      </CardShell>
    </div>
  );
}
