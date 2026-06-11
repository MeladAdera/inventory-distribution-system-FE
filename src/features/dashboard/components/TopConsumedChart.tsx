'use client';

import { useI18n } from '@/providers/I18nProvider';
import { TOP_CONSUMED } from '../mock/dashboardData';

export function TopConsumedChart() {
  const { locale } = useI18n();
  const max = TOP_CONSUMED[0].value;
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  return (
    <div className="flex flex-col gap-4">
      {TOP_CONSUMED.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        const name = locale === 'ar' ? item.nameAr : item.nameEn;
        return (
          <div key={item.nameEn} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-ink-800 truncate">{name}</span>
              <span className="text-sm font-mono text-ink-700 shrink-0 tabular-nums">
                {item.value.toLocaleString(localeCode)}
              </span>
            </div>
            <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
