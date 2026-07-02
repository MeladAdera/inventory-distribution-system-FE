'use client';

import { Boxes, Layers, AlertTriangle, PackageX } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { Card, CardContent } from '@/common/components/ui/card';
import { cn } from '@/common/utils/cn';
import type { AdminInventoryStats } from '../hooks/useAdminInventory';

interface Props {
  stats: AdminInventoryStats;
  isLoading: boolean;
  onLowStockClick: () => void;
  onOutOfStockClick: () => void;
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  localeCode,
  clickable,
  onClick,
  isLoading,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
  localeCode: string;
  clickable?: boolean;
  onClick?: () => void;
  isLoading: boolean;
}) {
  return (
    <Card
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={cn(
        'flex flex-col',
        clickable &&
          'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-sm'
      )}
    >
      <CardContent className="p-5 flex flex-col">
        <div
          className="w-9.5 h-9.5 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} className={iconColor} />
        </div>
        <p className="mt-4 text-xs font-medium text-ink-500">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-9 w-20 rounded skeleton-shimmer" />
        ) : (
          <p
            className="mt-1 text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-ink-900"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {typeof value === 'number' ? value.toLocaleString(localeCode) : value}
          </p>
        )}
        <p className="mt-1.5 text-xs text-ink-400">{sub}</p>
      </CardContent>
    </Card>
  );
}

export function InventoryStatsCards({
  stats,
  isLoading,
  onLowStockClick,
  onOutOfStockClick,
}: Props) {
  const { t, locale } = useI18n();
  const iv = t.inventory;
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Boxes}
        iconBg="#FEF3C7"
        iconColor="text-amber-600"
        label={iv.stats.totalSKUs}
        value={stats.totalSKUs}
        sub={iv.stats.totalSKUsSub}
        localeCode={localeCode}
        isLoading={isLoading}
      />
      <StatCard
        icon={Layers}
        iconBg="#DBEAFE"
        iconColor="text-blue-600"
        label={iv.stats.totalUnits}
        value={stats.totalUnits}
        sub={iv.stats.totalUnitsSub}
        localeCode={localeCode}
        isLoading={isLoading}
      />
      <StatCard
        icon={AlertTriangle}
        iconBg="#FEF9C3"
        iconColor="text-yellow-600"
        label={iv.stats.lowStock}
        value={stats.lowStockCount}
        sub={iv.stats.lowStockSub}
        localeCode={localeCode}
        clickable
        onClick={onLowStockClick}
        isLoading={isLoading}
      />
      <StatCard
        icon={PackageX}
        iconBg="#FEE2E2"
        iconColor="text-danger-600"
        label={iv.stats.outOfStock}
        value={stats.outOfStockCount}
        sub={iv.stats.outOfStockSub}
        localeCode={localeCode}
        clickable
        onClick={onOutOfStockClick}
        isLoading={isLoading}
      />
    </div>
  );
}
