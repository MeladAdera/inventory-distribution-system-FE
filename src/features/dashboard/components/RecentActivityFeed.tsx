'use client';

import { Truck, MinusCircle, PlusCircle, Edit3 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatRelativeTime } from '@/common/utils/string.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useAuditLogs } from '@/features/audit-logs/hooks/useAuditLogs';
import type { AuditLog } from '@/features/audit-logs/types/audit-logs.types';

type ActivityType = 'transfer' | 'consumption' | 'added' | 'adjust';

const ICON_MAP: Record<ActivityType, { Icon: React.ElementType; color: string }> = {
  transfer: { Icon: Truck, color: 'text-info-700' },
  consumption: { Icon: MinusCircle, color: 'text-warning-700' },
  added: { Icon: PlusCircle, color: 'text-success-700' },
  adjust: { Icon: Edit3, color: 'text-ink-500' },
};

function getActivityType(log: AuditLog): ActivityType {
  const action = (log.action ?? '').toUpperCase();
  const type = (log.type ?? '').toUpperCase();
  if (action === 'STOCK_IN' || action === 'ADD') return 'added';
  if (type.includes('ORDER') || action.includes('ORDER') || action.includes('SHIP'))
    return 'transfer';
  if (action.includes('ADJUST') || action.includes('DECREASE') || action.includes('REMOVE'))
    return 'adjust';
  return 'consumption';
}

function getActivityText(log: AuditLog): string {
  if (log.notes) {
    const qty = log.quantity != null ? ` (${log.quantity} units)` : '';
    return `${log.notes}${qty}`;
  }
  const qty = log.quantity != null ? ` · ${log.quantity} units` : '';
  const action = (log.action ?? 'activity').replace(/_/g, ' ').toLowerCase();
  return `${action} — ${log.entity_type} #${log.entity_id}${qty}`;
}

function SkeletonItem() {
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <div className="w-7.5 h-7.5 rounded-lg skeleton-shimmer shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5 mt-1">
        <div className="h-3 rounded skeleton-shimmer w-4/5" />
        <div className="h-2.5 rounded skeleton-shimmer w-1/4" />
      </div>
    </li>
  );
}

export function RecentActivityFeed() {
  const { locale } = useI18n();
  const { auditLogs, isLoading } = useAuditLogs({ limit: 6 });

  const items: AuditLog[] = auditLogs?.data?.data ?? [];

  if (isLoading) {
    return (
      <ul className="py-1.5" role="list">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-ink-400">
        No recent activity
      </div>
    );
  }

  return (
    <ul className="py-1.5" role="list">
      {items.map((log) => {
        const type = getActivityType(log);
        const { Icon, color } = ICON_MAP[type];
        const text = getActivityText(log);
        const time = formatRelativeTime(log.created_at, locale);

        return (
          <li key={log.id} className="flex items-start gap-3 px-5 py-3" role="listitem">
            <div className="w-7.5 h-7.5 rounded-lg bg-sand-100 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={15} className={cn(color)} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] text-ink-800 leading-snug">{text}</p>
              <time className="mt-0.5 text-[11px] text-ink-400 font-mono block">{time}</time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
