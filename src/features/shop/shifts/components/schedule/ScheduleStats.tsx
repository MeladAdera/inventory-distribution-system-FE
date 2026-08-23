'use client';

import { KpiCard } from '../ui/KpiCard';
import { weekdayNames } from '../../utils/time.utils';
import type { WeekStats } from '../../hooks/useWeekSchedule';

interface ScheduleStatsProps {
  stats: WeekStats;
  locale: string;
  labels: {
    scheduled: string;
    coveredHours: string;
    hoursUnit: string;
    unstaffed: string;
    unstaffedContext: string;
    closedDays: string;
    noClosedDays: string;
  };
}

export function ScheduleStats({ stats, locale, labels }: ScheduleStatsProps) {
  const names = weekdayNames(locale);
  // Two decimals so a 45m slot reads as 0.75 rather than rounding away.
  const hours = (stats.coveredMinutes / 60).toFixed(2).replace(/\.00$/, '');

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard label={labels.scheduled} value={stats.scheduledShifts} />
      <KpiCard label={labels.coveredHours} value={`${hours} ${labels.hoursUnit}`} />
      {/* Amber on purpose: this is the one figure on the strip that asks the
          owner to do something, and the design leans on it as the trigger. */}
      <KpiCard
        label={labels.unstaffed}
        value={stats.unstaffedShifts}
        variant={stats.unstaffedShifts > 0 ? 'attention' : 'default'}
        context={stats.unstaffedShifts > 0 ? labels.unstaffedContext : undefined}
      />
      <KpiCard
        label={labels.closedDays}
        value={stats.closedDays.length}
        context={
          stats.closedDays.length > 0
            ? stats.closedDays.map((d) => names[d.weekday]).join('، ')
            : labels.noClosedDays
        }
      />
    </div>
  );
}
