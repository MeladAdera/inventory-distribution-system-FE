'use client';

import { useRouter } from 'next/navigation';
import {
  Package,
  Store,
  ClipboardList,
  TrendingDown,
  ShoppingCart,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useAuth } from '@/features/auth';
import { KpiCard } from '@/features/admin/dashboard/components/KpiCard';
import { CardShell } from '@/features/admin/dashboard/components/CardShell';
import { ConsumptionTrendChart } from '@/features/admin/dashboard/components/ConsumptionTrendChart';
import { TopConsumedChart } from '@/features/admin/dashboard/components/TopConsumedChart';
import { LowStockAlertsTable } from '@/features/admin/dashboard/components/LowStockAlertsTable';
import { RecentActivityFeed } from '@/features/admin/dashboard/components/RecentActivityFeed';
import { useDashboardStats } from '@/features/admin/dashboard/hooks/useDashboardStats';
import { WelcomeTyper } from '@/features/admin/dashboard/components/WelcomeTyper';

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const d = t.dashboard;

  const firstName = user?.name?.split(' ')[0] ?? '';
  const greeting = d.header.greeting.replace('{name}', firstName);

  const {
    totalProducts,
    totalShops,
    pendingOrders,
    lowStockItems,
    totalOrders,
    completedOrders,
    isLoading,
  } = useDashboardStats();

  const phrases = isLoading
    ? []
    : d.typer.phrases.map((p) =>
        p
          .replace('{pending}', String(pendingOrders))
          .replace('{low}', String(lowStockItems))
          .replace('{shops}', String(totalShops))
      );

  const val = (n: number) => (isLoading ? '—' : n);

  const kpiCards = [
    {
      icon: Package,
      iconBg: 'bg-ink-900',
      iconColor: 'text-amber-500',
      label: d.kpi.totalProducts,
      value: val(totalProducts),
      trend: undefined,
      sub: d.kpi.totalProductsSub,
      clickable: true,
      onClick: () => router.push('/products'),
    },
    {
      icon: Store,
      iconBg: 'bg-info-100',
      iconColor: 'text-info-700',
      label: d.kpi.totalClients,
      value: val(totalShops),
      trend: undefined,
      sub: d.kpi.totalClientsSub,
      clickable: true,
      onClick: () => router.push('/shops'),
    },
    {
      icon: ClipboardList,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      label: d.kpi.stockValue,
      value: val(pendingOrders),
      trend: undefined,
      sub: d.kpi.stockValueSub,
      clickable: true,
      onClick: () => router.push('/transfers'),
    },
    {
      icon: TrendingDown,
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-700',
      label: d.kpi.runningLow,
      value: val(lowStockItems),
      trend: undefined,
      sub: d.kpi.runningLowSub,
      clickable: true,
      onClick: () => router.push('/shortages'),
    },
    {
      icon: ShoppingCart,
      iconBg: 'bg-success-100',
      iconColor: 'text-success-700',
      label: d.kpi.todayUsage,
      value: val(totalOrders),
      trend: undefined,
      sub: d.kpi.todayUsageSub,
      clickable: true,
      onClick: () => router.push('/transfers'),
    },
    {
      icon: CheckCircle2,
      iconBg: 'bg-ink-900',
      iconColor: 'text-amber-500',
      label: d.kpi.monthlyUsage,
      value: val(completedOrders),
      trend: undefined,
      sub: d.kpi.monthlyUsageSub,
      clickable: true,
      onClick: () => router.push('/receipts'),
    },
  ];

  return (
    <div className="max-w-330 mx-auto pb-16 lg:pb-6">
      {/* ── Layer 1: Page Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-px h-3.5 bg-ink-700" />
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-600">
              {d.header.eyebrow}
            </span>
          </div>
          <WelcomeTyper greeting={greeting} phrases={phrases} />
        </div>

        <button
          onClick={() => router.push('/transfers')}
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
        <CardShell title={d.charts.consumptionTrend} noPadding>
          <ConsumptionTrendChart />
        </CardShell>
        <CardShell title={d.charts.topConsumed}>
          <TopConsumedChart />
        </CardShell>
      </div>

      {/* ── Layer 4: Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
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
          <LowStockAlertsTable />
        </CardShell>

        <CardShell title={d.activity.title} noPadding>
          <RecentActivityFeed />
        </CardShell>
      </div>
    </div>
  );
}
