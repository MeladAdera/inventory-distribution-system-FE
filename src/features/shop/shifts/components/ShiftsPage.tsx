'use client';

import { useI18n } from '@/providers/I18nProvider';
import { ScheduleTab } from './ScheduleTab';
import { HistoryTab } from './HistoryTab';
import { ReportTab } from './ReportTab';
import { PageHeader } from './ui/PageHeader';
import { ShiftTabs, useShiftTab } from './ui/ShiftTabs';

/**
 * The owner's shift pages. Employees never reach this route — every endpoint
 * behind it is owner-only, and the middleware keeps it out of their portal.
 *
 * A thin shell on purpose: each tab owns its own queries, filters and loading
 * state, so one tab failing never blanks the other two and switching tabs does
 * not throw away where someone had got to.
 */
export function ShiftsPage() {
  const { t } = useI18n();
  const s = t.shifts;
  const [tab, setTab] = useShiftTab();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <PageHeader title={s.page.title} description={s.page.subtitle} />

      <div className="mb-5 mt-5">
        <ShiftTabs tab={tab} onChange={setTab} labels={s.page.tabs} />
      </div>

      {tab === 'history' ? <HistoryTab /> : tab === 'report' ? <ReportTab /> : <ScheduleTab />}
    </div>
  );
}
