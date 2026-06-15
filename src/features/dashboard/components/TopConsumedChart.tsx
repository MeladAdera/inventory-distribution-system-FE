'use client';

import { useI18n } from '@/providers/I18nProvider';
import { useTopProducts } from '@/features/analytics/hooks/useTopProducts';

function SkeletonBar() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-3 rounded skeleton-shimmer w-2/3" />
        <div className="h-3 rounded skeleton-shimmer w-10" />
      </div>
      <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
        <div className="h-full skeleton-shimmer rounded-full" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

export function TopConsumedChart() {
  const { locale } = useI18n();
  const { topProducts, isLoading } = useTopProducts(5);
  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBar key={i} />
        ))}
      </div>
    );
  }

  if (topProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-ink-400">No data yet</div>
    );
  }

  const max = topProducts[0].total_quantity;

  return (
    <div className="flex flex-col gap-4">
      {topProducts.map((item) => {
        const pct = Math.round((item.total_quantity / max) * 100);
        return (
          <div key={item.product_id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-ink-800 truncate">{item.product_name}</span>
              <span className="text-sm font-mono text-ink-700 shrink-0 tabular-nums">
                {item.total_quantity.toLocaleString(localeCode)}
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
