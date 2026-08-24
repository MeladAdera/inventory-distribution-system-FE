'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NARROW_QUERY, useMediaQuery } from '@/common/hooks/useMediaQuery';
import { CalendarClock, Download } from 'lucide-react';
import { Button } from '@/common/components/ui/button';
import { ConfirmDialog, Modal } from '@/common/components';
import { downloadCsv, dateStampedName } from '@/common/utils/csv.utils';
import { formatMoneyGrouped } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { useWeekSchedule, type ScheduleEntry } from '../hooks/useWeekSchedule';
import { useOpeningHours } from '../hooks/useOpeningHours';
import { useShiftTemplates } from '../hooks/useShiftTemplates';
import { useShopPeople } from '../hooks/useShopPeople';
import {
  formatDuration,
  fromISODate,
  splitWindow,
  startOfWeek,
  toISODate,
  weekdayNames,
} from '../utils/time.utils';
import type { OpeningHourInput, ShiftTemplate, Weekday } from '../types/shifts.types';
import { OpeningHoursCard } from './schedule/OpeningHoursCard';
import { WeekToolbar, type ScheduleView } from './schedule/WeekToolbar';
import { ScheduleStats } from './schedule/ScheduleStats';
import { ScheduleBoard } from './schedule/ScheduleBoard';
import { SlotEditorModal } from './schedule/SlotEditorModal';
import { AssignModal } from './schedule/AssignModal';
import { ShiftDrawer } from './history/ShiftDrawer';
import { ErrorState, KpiSkeleton, TableSkeleton } from './ui/DataStates';

/**
 * The plan for one week, overlaid with what actually happened on it.
 *
 * Opening hours moved behind a button rather than sitting above the board: they
 * change a few times a year, while the board is read daily, and the redesign is
 * explicit that no large block should push the week below the fold.
 */
export function ScheduleTab() {
  const { t, locale } = useI18n();
  const s = t.shifts;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [weekStart, setWeekStart] = useState(() => toISODate(startOfWeek(new Date())));
  const [view, setView] = useState<ScheduleView>('week');
  const [activeWeekday, setActiveWeekday] = useState<Weekday>(() => new Date().getDay() as Weekday);

  const [hoursOpen, setHoursOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftTemplate | null>(null);
  const [creatingOn, setCreatingOn] = useState<Weekday>(activeWeekday);
  const [assigning, setAssigning] = useState<ShiftTemplate | null>(null);
  const [removing, setRemoving] = useState<ShiftTemplate | null>(null);
  const [splittingWeekday, setSplittingWeekday] = useState<Weekday | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const week = useWeekSchedule(weekStart);
  const { saveHours, isSaving } = useOpeningHours();
  const {
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    deleteTemplate,
    isDeleting,
    assignEmployees,
    isAssigning,
  } = useShiftTemplates();
  const { userNames } = useShopPeople();

  // Seven columns do not fit a phone at any zoom, so the week board is not
  // merely a poor default there — it is unavailable, and asking for it falls
  // back to the day. Driven by a live media query rather than a one-shot width
  // check on mount, which never noticed a rotation and rendered a frame of the
  // wrong layout first.
  const isNarrow = useMediaQuery(NARROW_QUERY);
  const effectiveView: ScheduleView = isNarrow && view === 'week' ? 'day' : view;

  const slotCounts = useMemo(
    () =>
      new Map<Weekday, number>(
        Array.from(week.byWeekday.entries()).map(([w, list]) => [w, list.length])
      ),
    [week.byWeekday]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function shiftWeek(weeks: number) {
    const next = fromISODate(weekStart);
    next.setDate(next.getDate() + weeks * 7);
    setWeekStart(toISODate(next));
  }

  async function handleSaveHours(draft: OpeningHourInput[]) {
    try {
      await saveHours({ days: draft });
      toast.success(s.hours.toastSaved);
      setHoursOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSplit(weekday: Weekday, count: number) {
    const day = week.days.find((d) => d.weekday === weekday);
    if (!day || day.is_closed) return;

    const windows = splitWindow(day.open_time, day.close_time, count);
    const dayName = weekdayNames(locale)[weekday];
    setSplittingWeekday(weekday);
    try {
      // Sequential: the server hands out the lowest free slot position, and
      // parallel creates would race for the same one.
      for (let i = 0; i < windows.length; i += 1) {
        await createTemplate({
          weekday,
          name: `${dayName} ${i + 1}`,
          startTime: windows[i].startTime,
          endTime: windows[i].endTime,
        });
      }
      toast.success(
        s.hours.toastSplit.replace('{count}', String(windows.length)).replace('{day}', dayName)
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSplittingWeekday(null);
    }
  }

  async function handleSubmitSlot(data: { name: string; startTime: string; endTime: string }) {
    if (editing) {
      await updateTemplate({ id: editing.id, data });
      toast.success(s.slotEditor.toastUpdated);
    } else {
      await createTemplate({ weekday: creatingOn, ...data });
      toast.success(s.slotEditor.toastCreated);
    }
  }

  async function handleRemove() {
    if (!removing) return;
    try {
      await deleteTemplate(removing.id);
      toast.success(s.removeSlot.toastRemoved);
      setRemoving(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleExport() {
    const names = weekdayNames(locale);
    const rows: (string | number)[][] = [];
    for (const [weekday, entries] of week.entriesByWeekday) {
      for (const e of entries) {
        rows.push([
          e.date,
          names[weekday],
          e.name || s.entry.offSchedule,
          e.startTime,
          e.endTime ?? '',
          e.durationMinutes !== null ? formatDuration(e.durationMinutes) : '',
          s.states[e.state],
          e.session?.user_name ?? '',
          e.session ? e.session.receipt_count : '',
          e.session ? formatMoneyGrouped(e.session.sales_total) : '',
          e.session?.cash_difference ?? '',
        ]);
      }
    }
    downloadCsv(
      dateStampedName(s.export.filename),
      [
        s.history.cols.date,
        s.report.cols.weekday,
        s.history.cols.shift,
        s.history.cols.opened,
        s.history.cols.closed,
        s.slotEditor.duration,
        s.history.filters.status,
        s.history.cols.employee,
        s.report.cols.receipts,
        s.history.cols.sold,
        s.history.cols.difference,
      ],
      rows
    );
  }

  function openEditor(entry: ScheduleEntry) {
    if (!entry.template) return;
    setEditing(entry.template);
    setEditorOpen(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (week.error) {
    return (
      <ErrorState
        title={s.page.errorMsg}
        detail={getErrorMessage(week.error)}
        retryLabel={s.page.retry}
        // A real refetch. Nudging local state would re-render the same failure.
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['shifts'] })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setHoursOpen(true)}>
          <CalendarClock size={14} />
          {s.hours.title}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download size={14} />
          {s.export.label}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setCreatingOn(activeWeekday);
            setEditorOpen(true);
          }}
        >
          {s.create.label}
        </Button>
      </div>

      <WeekToolbar
        weekStart={weekStart}
        onShift={shiftWeek}
        onToday={() => {
          setWeekStart(toISODate(startOfWeek(new Date())));
          setActiveWeekday(new Date().getDay() as Weekday);
        }}
        view={effectiveView}
        onViewChange={setView}
        hideWeek={isNarrow}
        timezone={week.timezone}
        labels={s.toolbar}
      />

      {week.isLoading ? (
        <>
          <KpiSkeleton />
          <TableSkeleton rows={4} />
        </>
      ) : (
        <>
          <ScheduleStats stats={week.stats} locale={locale} labels={s.stats} />

          <ScheduleBoard
            view={effectiveView}
            dates={week.dates}
            entriesByWeekday={week.entriesByWeekday}
            days={week.days}
            canAddSlot={week.canAddSlot}
            activeWeekday={activeWeekday}
            onActiveWeekdayChange={setActiveWeekday}
            locale={locale}
            currency={t.debts.currency}
            onAdd={(weekday) => {
              setEditing(null);
              setCreatingOn(weekday);
              setEditorOpen(true);
            }}
            onEdit={openEditor}
            onAssign={(entry) => entry.template && setAssigning(entry.template)}
            onRemove={(entry) => entry.template && setRemoving(entry.template)}
            onOpenSession={(entry) => entry.session && setSessionId(entry.session.id)}
            labels={{
              closedDay: s.grid.closedDay,
              empty: s.entry.empty,
              addSlot: s.grid.addSlot,
              addForDay: s.entry.addForDay,
              full: s.grid.full,
              card: {
                states: s.states,
                offSchedule: s.entry.offSchedule,
                unnamed: s.entry.unnamed,
                running: s.entry.running,
                invoices: s.entry.invoices,
                unassigned: s.grid.unassigned,
                edit: s.grid.edit,
                remove: s.grid.remove,
                assign: s.grid.assign,
                more: s.grid.more,
              },
            }}
          />
        </>
      )}

      <Modal open={hoursOpen} onClose={() => setHoursOpen(false)} title={s.hours.title} size="xl">
        <OpeningHoursCard
          days={week.days}
          timezone={week.timezone}
          locale={locale}
          onSave={handleSaveHours}
          isSaving={isSaving}
          onSplit={handleSplit}
          splittingWeekday={splittingWeekday}
          slotCounts={slotCounts}
          labels={s.hours}
        />
      </Modal>

      <SlotEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editing}
        weekday={creatingOn}
        day={week.days.find((d) => d.weekday === (editing?.weekday ?? creatingOn))}
        locale={locale}
        onSubmit={handleSubmitSlot}
        isSubmitting={isCreating || isUpdating}
        labels={s.slotEditor}
      />

      {assigning && (
        <AssignModal
          open
          onClose={() => setAssigning(null)}
          template={assigning}
          onSubmit={async (userIds) => {
            await assignEmployees({ id: assigning.id, data: { userIds } });
            toast.success(s.assign.toastSaved);
          }}
          isSubmitting={isAssigning}
          labels={s.assign}
        />
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title={s.removeSlot.title}
        description={s.removeSlot.body.replace('{name}', removing?.name ?? '')}
        confirmLabel={s.removeSlot.confirm}
        cancelLabel={s.removeSlot.cancel}
        isLoading={isDeleting}
      />

      {/* A worked shift on the board opens the same drawer the history uses —
          one detail surface, so the two cannot drift apart. */}
      <ShiftDrawer
        sessionId={sessionId}
        onClose={() => setSessionId(null)}
        currency={t.debts.currency}
        userNames={userNames}
        formatDay={(date) =>
          new Intl.DateTimeFormat(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          }).format(fromISODate(date))
        }
        formatTime={(iso) =>
          new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
            new Date(iso)
          )
        }
        labels={{ ...s.detail, duration: s.history.duration }}
        noSlotLabel={s.history.noSlot}
        stillOpenLabel={s.history.stillOpen}
        notCountedLabel={s.history.notCounted}
        statusLabels={{ completed: s.states.completed, open: s.states.open }}
      />
    </div>
  );
}
