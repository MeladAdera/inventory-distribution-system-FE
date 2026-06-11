'use client';

import { Truck, MinusCircle, PlusCircle, Edit3 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { useI18n } from '@/providers/I18nProvider';
import { ACTIVITIES, type ActivityType } from '../mock/dashboardData';

const ICON_MAP: Record<ActivityType, { Icon: React.ElementType; color: string }> = {
  transfer: { Icon: Truck, color: 'text-info-700' },
  consumption: { Icon: MinusCircle, color: 'text-warning-700' },
  added: { Icon: PlusCircle, color: 'text-success-700' },
  adjust: { Icon: Edit3, color: 'text-ink-500' },
};

export function RecentActivityFeed() {
  const { locale } = useI18n();

  return (
    <ul className="py-1.5" role="list">
      {ACTIVITIES.map((item) => {
        const { Icon, color } = ICON_MAP[item.type];
        const text = locale === 'ar' ? item.textAr : item.textEn;
        const time = locale === 'ar' ? item.timeAr : item.timeEn;

        return (
          <li key={item.id} className="flex items-start gap-3 px-5 py-3" role="listitem">
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
