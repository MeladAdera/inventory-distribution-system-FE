'use client';

import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface KpiCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: { label: string; direction: 'up' | 'down' };
  sub: string;
  clickable?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  trend,
  sub,
  clickable,
  onClick,
}: KpiCardProps) {
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? label : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
      className={cn(
        'bg-paper border border-border rounded-xl p-5 flex flex-col',
        clickable &&
          'cursor-pointer transition-all duration-180 hover:-translate-y-px hover:shadow-(--shadow-sm)'
      )}
    >
      {/* Row 1 — icon + trend */}
      <div className="flex items-start justify-between">
        <div className={cn('w-9.5 h-9.5 rounded-[10px] flex items-center justify-center', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trend.direction === 'up' ? 'text-success-700' : 'text-danger-700'
            )}
          >
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.label}
          </span>
        )}
      </div>

      {/* Row 2 — label */}
      <p className="mt-4 text-xs font-medium text-ink-500">{label}</p>

      {/* Row 3 — value */}
      <p
        className="mt-1 text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-ink-900"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {value}
      </p>

      {/* Row 4 — sub */}
      <p className="mt-1.5 text-xs text-ink-400">{sub}</p>
    </div>
  );
}
