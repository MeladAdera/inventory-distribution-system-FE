'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers';
import { ConfirmDialog } from '@/common/components';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useOpeningHours } from '../hooks/useOpeningHours';
import { useShiftTemplates } from '../hooks/useShiftTemplates';
import { splitWindow, weekdayNames } from '../utils/time.utils';
import type { OpeningHourInput, ShiftTemplate, Weekday } from '../types/shifts.types';
import { OpeningHoursCard } from './schedule/OpeningHoursCard';
import { WeekGrid } from './schedule/WeekGrid';
import { SlotEditorModal } from './schedule/SlotEditorModal';
import { AssignModal } from './schedule/AssignModal';
import { HistoryTab } from './HistoryTab';
import { ReportTab } from './ReportTab';
import { PageHeader } from './ui/PageHeader';
import { ShiftTabs, useShiftTab } from './ui/ShiftTabs';

/**
 * The owner's shift planning page. Employees never reach it — every endpoint
 * behind the Schedule tab is owner-only, and the middleware keeps the route out
 * of their portal.
 */
export function ShiftsPage() {
  const { t, locale } = useI18n();
  const s = t.shifts;
  const toast = useToast();

  // Tab state lives in `?tab=` so it survives a reload and the back button.
  const [tab, setTab] = useShiftTab();
  const [splittingWeekday, setSplittingWeekday] = useState<Weekday | null>(null);

  // `editing` carries the slot being changed; `creatingOn` the day a new one
  // lands on. Kept apart so the editor knows which of the two it is doing.
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftTemplate | null>(null);
  const [creatingOn, setCreatingOn] = useState<Weekday>(0);
  const [assigning, setAssigning] = useState<ShiftTemplate | null>(null);
  const [removing, setRemoving] = useState<ShiftTemplate | null>(null);

  const {
    days,
    timezone,
    isLoading: hoursLoading,
    error: hoursError,
    saveHours,
    isSaving,
  } = useOpeningHours();
  const {
    byWeekday,
    canAddSlot,
    isLoading: templatesLoading,
    error: templatesError,
    createTemplate,
    isCreating,
    updateTemplate,
    isUpdating,
    deleteTemplate,
    isDeleting,
    assignEmployees,
    isAssigning,
  } = useShiftTemplates();

  const isLoading = hoursLoading || templatesLoading;
  const error = hoursError ?? templatesError;

  const slotCounts = new Map<Weekday, number>(
    Array.from(byWeekday.entries()).map(([w, list]) => [w, list.length])
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSaveHours(draft: OpeningHourInput[]) {
    try {
      // All seven days go every time; the API rejects a partial week.
      await saveHours({ days: draft });
      toast.success(s.hours.toastSaved);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSplit(weekday: Weekday, count: number) {
    const day = days.find((d) => d.weekday === weekday);
    if (!day || day.is_closed) return;

    const windows = splitWindow(day.open_time, day.close_time, count);
    const dayName = weekdayNames(locale)[weekday];
    setSplittingWeekday(weekday);
    try {
      // Sequential, not parallel: the server assigns each slot the lowest free
      // position 1–4, and concurrent creates would race for the same one.
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
      // A partial split is still a real change — whatever landed stays, and the
      // grid refetches to show exactly how far it got.
      toast.error(getErrorMessage(err));
    } finally {
      setSplittingWeekday(null);
    }
  }

  async function handleSubmitSlot(data: { name: string; startTime: string; endTime: string }) {
    if (editing) {
      // weekday is deliberately absent — the API cannot move a slot between days.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <PageHeader title={s.page.title} description={s.page.subtitle} />

      <div className="mb-5 mt-5">
        <ShiftTabs tab={tab} onChange={setTab} labels={s.page.tabs} />
      </div>

      {/* Each tab carries its own loading and error state. The schedule's
          queries must not gate History or Report — a failed templates fetch
          would otherwise blank out two tabs that never needed it. */}
      {tab === 'history' ? (
        <HistoryTab />
      ) : tab === 'report' ? (
        <ReportTab />
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[14px]">{s.page.loading}</span>
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <AlertTriangle size={28} className="text-danger-700" />
          <p className="text-[14px] text-ink-600">{s.page.errorMsg}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <OpeningHoursCard
            days={days}
            timezone={timezone}
            locale={locale}
            onSave={handleSaveHours}
            isSaving={isSaving}
            onSplit={handleSplit}
            splittingWeekday={splittingWeekday}
            slotCounts={slotCounts}
            labels={s.hours}
          />

          <WeekGrid
            byWeekday={byWeekday}
            days={days}
            canAddSlot={canAddSlot}
            locale={locale}
            onAdd={(weekday) => {
              setEditing(null);
              setCreatingOn(weekday);
              setEditorOpen(true);
            }}
            onEdit={(template) => {
              setEditing(template);
              setEditorOpen(true);
            }}
            onAssign={setAssigning}
            onRemove={setRemoving}
            labels={s.grid}
          />
        </div>
      )}

      <SlotEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        template={editing}
        weekday={creatingOn}
        day={days.find((d) => d.weekday === (editing?.weekday ?? creatingOn))}
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
    </div>
  );
}
