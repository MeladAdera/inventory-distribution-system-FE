'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { DateRangeChip } from '@/common/components';
import { useI18n } from '@/providers/I18nProvider';
import { useShiftReport } from '../hooks/useShiftReport';
import { ShiftReportTables } from './report/ShiftReportTables';

/** Shift totals by employee and by slot. Owner only. */
export function ReportTab() {
  const { t, locale } = useI18n();
  const s = t.shifts;

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = useMemo(() => ({ ...(from ? { from } : {}), ...(to ? { to } : {}) }), [from, to]);

  const { report, isLoading, error } = useShiftReport(params);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-[16px] font-semibold text-ink-900">{s.report.title}</h2>
        <p className="mt-1 text-[13px] text-ink-500">{s.report.subtitle}</p>
      </header>

      {/* The same range pill as the debts, receipts and history filters — one
          way to pick a date range across the app. */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeChip
          fromDate={from}
          toDate={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onClear={() => {
            setFrom('');
            setTo('');
          }}
          locale={locale}
          labels={{
            from: s.history.filters.from,
            to: s.history.filters.to,
            clear: s.history.filters.clear,
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[14px]">{s.report.loading}</span>
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3">
          <AlertTriangle size={28} className="text-danger-700" />
          <p className="text-[14px] text-ink-600">{s.report.errorMsg}</p>
        </div>
      ) : (
        <ShiftReportTables
          report={report}
          locale={locale}
          currency={t.debts.currency}
          labels={s.report}
        />
      )}
    </div>
  );
}
