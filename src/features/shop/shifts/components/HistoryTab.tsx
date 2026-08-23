'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Pagination } from '@/common/components';
import { useI18n } from '@/providers/I18nProvider';
import { useShiftSessions } from '../hooks/useShiftSessions';
import { useShopPeople } from '../hooks/useShopPeople';
import { SessionFilters, type SessionFilterValues } from './history/SessionFilters';
import { SessionsTableCard } from './history/SessionsTableCard';
import { SessionDetailModal } from './history/SessionDetailModal';

const LIMIT = 15;

/**
 * Shift history. Owner only — GET /shifts/sessions is 403 for an EMPLOYEE.
 *
 * Holds its own filter and page state rather than lifting it into ShiftsPage,
 * so switching tabs away and back does not reset someone's filters and the
 * schedule tab's loading state never gates this one.
 */
export function HistoryTab() {
  const { t, locale } = useI18n();
  const s = t.shifts;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SessionFilterValues>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const params = useMemo(() => ({ page, limit: LIMIT, ...filters }), [page, filters]);

  const { byBusinessDate, total, isLoading, error } = useShiftSessions(params);
  const { people, userNames } = useShopPeople();

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <AlertTriangle size={28} className="text-danger-700" />
        <p className="text-[14px] text-ink-600">{s.history.errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-[16px] font-semibold text-ink-900">{s.history.title}</h2>
        <p className="mt-1 text-[13px] text-ink-500">{s.history.subtitle}</p>
      </header>

      <SessionFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1); // a narrower filter can leave the current page empty
        }}
        people={people}
        labels={s.history.filters}
      />

      <SessionsTableCard
        byBusinessDate={byBusinessDate}
        isLoading={isLoading}
        locale={locale}
        currency={t.debts.currency}
        userNames={userNames}
        onSelect={(row) => setSelectedId(row.id)}
        labels={s.history}
      />

      {total > LIMIT && (
        <Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} />
      )}

      <SessionDetailModal
        sessionId={selectedId}
        onClose={() => setSelectedId(null)}
        locale={locale}
        currency={t.debts.currency}
        userNames={userNames}
        labels={s.detail}
        noSlotLabel={s.history.noSlot}
        stillOpenLabel={s.history.stillOpen}
        notCountedLabel={s.history.notCounted}
      />
    </div>
  );
}
