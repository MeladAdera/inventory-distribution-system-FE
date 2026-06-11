'use client';

import { useRouter } from 'next/navigation';
import { Package, Users, Wallet, TrendingDown, Activity, Calendar, Plus } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { CardShell } from '@/features/dashboard/components/CardShell';
import { ConsumptionTrendChart } from '@/features/dashboard/components/ConsumptionTrendChart';
import { TopConsumedChart } from '@/features/dashboard/components/TopConsumedChart';
import { LowStockAlertsTable } from '@/features/dashboard/components/LowStockAlertsTable';
import { RecentActivityFeed } from '@/features/dashboard/components/RecentActivityFeed';

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const d = t.dashboard;

  const kpiCards = [
    {
      icon: Package,
      iconBg: 'bg-ink-900',
      iconColor: 'text-amber-500',
      label: d.kpi.totalProducts,
      value: 12,
      trend: { label: '+٢', direction: 'up' as const },
      sub: d.kpi.totalProductsSub,
    },
    {
      icon: Users,
      iconBg: 'bg-info-100',
      iconColor: 'text-info-700',
      label: d.kpi.totalClients,
      value: 6,
      trend: { label: '+١', direction: 'up' as const },
      sub: d.kpi.totalClientsSub,
    },
    {
      icon: Wallet,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      label: d.kpi.stockValue,
      value: 'د.إ 15,870',
      trend: { label: '+٤.٢٪', direction: 'up' as const },
      sub: d.kpi.stockValueSub,
    },
    {
      icon: TrendingDown,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-700',
      label: d.kpi.runningLow,
      value: 5,
      trend: undefined,
      sub: d.kpi.runningLowSub,
      clickable: true,
      onClick: () => router.push('/shortages'),
    },
    {
      icon: Activity,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-700',
      label: d.kpi.todayUsage,
      value: 680,
      trend: { label: '+١٢٪', direction: 'up' as const },
      sub: d.kpi.todayUsageSub,
    },
    {
      icon: Calendar,
      iconBg: 'bg-ink-900',
      iconColor: 'text-amber-500',
      label: d.kpi.monthlyUsage,
      value: '12,900',
      trend: { label: '−٣٪', direction: 'down' as const },
      sub: d.kpi.monthlyUsageSub,
    },
  ];

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Layer 1: Page Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        {/* Left: eyebrow + greeting + subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-px h-3.5 bg-ink-700" />
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-600">
              {d.header.eyebrow}
            </span>
          </div>
          <h1
            className="mt-3 text-[34px] font-medium leading-tight tracking-[-0.02em] text-ink-900"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {d.header.greeting}
          </h1>
          <p className="mt-2 text-sm text-ink-600">{d.header.subtitle}</p>
        </div>

        {/* Right: New Transfer button */}
        <button
          onClick={() => {}}
          className="inline-flex items-center gap-2 h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          {d.header.newTransfer}
        </button>
      </div>

      {/* ── Layer 2: KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            label={card.label}
            value={card.value}
            trend={card.trend}
            sub={card.sub}
            clickable={card.clickable}
            onClick={card.onClick}
          />
        ))}
      </div>

      {/* ── Layer 3: Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 mb-6">
        {/* Consumption Trend */}
        <CardShell title={d.charts.consumptionTrend} noPadding>
          <ConsumptionTrendChart />
        </CardShell>

        {/* Top Consumed */}
        <CardShell title={d.charts.topConsumed}>
          <TopConsumedChart />
        </CardShell>
      </div>

      {/* ── Layer 4: Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Low Stock Alerts */}
        <CardShell
          title={d.lowStock.title}
          noPadding
          action={
            <button
              onClick={() => router.push('/shortages')}
              className="text-[13px] font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              {d.lowStock.viewAll}
            </button>
          }
        >
          <LowStockAlertsTable onReplenish={() => {}} />
        </CardShell>

        {/* Recent Activity */}
        <CardShell title={d.activity.title} noPadding>
          <RecentActivityFeed />
        </CardShell>
      </div>
    </div>
  );
}
