'use client';

import { useEffect, useState } from 'react';
import { Loader2, Moon } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { Button } from '@/common/components/ui/button';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { OpeningHoursDay, ShiftTemplate, Weekday } from '../../types/shifts.types';
import {
  formatDuration,
  timeToMinutes,
  toPickerValue,
  weekdayNames,
  windowMinutes,
} from '../../utils/time.utils';
import { TimeField } from './TimeField';

interface SlotEditorModalProps {
  open: boolean;
  onClose: () => void;
  /** The slot being edited, or null when creating a new one. */
  template: ShiftTemplate | null;
  /** Which day a new slot lands on. Ignored when editing — weekday cannot move. */
  weekday: Weekday;
  /** That day's trading window, shown as the boundary the server will enforce. */
  day: OpeningHoursDay | undefined;
  locale: string;
  onSubmit: (data: { name: string; startTime: string; endTime: string }) => Promise<void>;
  isSubmitting: boolean;
  labels: {
    createTitle: string;
    editTitle: string;
    name: string;
    namePlaceholder: string;
    start: string;
    end: string;
    boundsHint: string;
    duration: string;
    pastMidnight: string;
    submit: string;
    cancel: string;
    errName: string;
    errSameTime: string;
  };
}

/**
 * Create or rename a slot.
 *
 * Overlap, opening-hour bounds and the four-a-day limit are all left to the
 * server. In particular there is NO client-side overlap guard: 08:00–16:00 and
 * 16:00–24:00 touch without conflicting, and the naive check would reject the
 * single most common way to split a day. The day's hours are shown as context,
 * and a rejection is rendered verbatim.
 */
export function SlotEditorModal({
  open,
  onClose,
  template,
  weekday,
  day,
  locale,
  onSubmit,
  isSubmitting,
  labels,
}: SlotEditorModalProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setStartTime(toPickerValue(template?.start_time ?? day?.open_time ?? '08:00'));
    setEndTime(toPickerValue(template?.end_time ?? day?.close_time ?? '16:00'));
    setError(null);
  }, [open, template, day]);

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return setError(labels.errName);
    // The one check worth making locally, because the server's own
    // shift.INVALID_SLOT_WINDOW says the same thing after a round trip.
    if (timeToMinutes(startTime) === timeToMinutes(endTime)) return setError(labels.errSameTime);

    setError(null);
    try {
      await onSubmit({ name: trimmed, startTime, endTime });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const overnight = timeToMinutes(endTime) <= timeToMinutes(startTime);
  const length = windowMinutes(startTime, endTime);
  const dayName = weekdayNames(locale)[template?.weekday ?? weekday];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template ? labels.editTitle : labels.createTitle}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {labels.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {labels.submit}
          </Button>
        </div>
      }
    >
      {day && !day.is_closed && (
        <p className="rounded-lg bg-sand-100 px-3 py-2 text-[12px] text-ink-500">
          {labels.boundsHint
            .replace('{open}', toPickerValue(day.open_time))
            .replace('{close}', toPickerValue(day.close_time))
            .replace('{day}', dayName)}
        </p>
      )}

      <label className="mt-4 block text-[13px] font-medium text-ink-700" htmlFor="slot-name">
        {labels.name}
      </label>
      <input
        id="slot-name"
        className="input mt-1.5"
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={labels.namePlaceholder}
      />

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <label className="block text-[13px] font-medium text-ink-700">{labels.start}</label>
          <div className="mt-1.5">
            <TimeField value={startTime} onChange={setStartTime} ariaLabel={labels.start} />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[13px] font-medium text-ink-700">{labels.end}</label>
          <div className="mt-1.5">
            <TimeField value={endTime} onChange={setEndTime} ariaLabel={labels.end} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-500">
        <span>
          {labels.duration}: <span className="tabular-nums">{formatDuration(length)}</span>
        </span>
        {overnight && (
          <span className="flex items-center gap-1 text-ink-400">
            <Moon size={12} />
            {labels.pastMidnight}
          </span>
        )}
      </div>

      {error && <p className="mt-3 text-[13px] text-danger-700">{error}</p>}
    </Modal>
  );
}
