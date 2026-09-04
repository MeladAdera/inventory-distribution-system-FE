'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { Button } from '@/common/components/ui/button';
import { isValidCashCount } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { CloseShiftInput, ShiftSession } from '../../types/shifts.types';
import { CashResultPanel } from './CashResultPanel';

interface CloseShiftModalProps {
  open: boolean;
  onClose: () => void;
  /** The shift being closed. Anyone in the shop may close anyone's shift. */
  session: ShiftSession;
  /** True when `session` belongs to the current user — only the title differs. */
  isMine: boolean;
  onCloseShift: (data: CloseShiftInput) => Promise<{ data: ShiftSession }>;
  isClosing: boolean;
  currency: string;
  labels: {
    title: string;
    titleOther: string;
    intro: string;
    counted: string;
    countedPlaceholder: string;
    countedHint: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    cancel: string;
    errRequired: string;
    errInvalid: string;
    result: React.ComponentProps<typeof CashResultPanel>['labels'];
  };
}

/**
 * The close, in two beats: count first, then the reveal.
 *
 * The form asks for the hand count and nothing else — no expected figure is on
 * screen while it is being typed, because a number to copy is not a count. Only
 * once the server has frozen the shift do the figures and the difference appear.
 */
export function CloseShiftModal({
  open,
  onClose,
  session,
  isMine,
  onCloseShift,
  isClosing,
  currency,
  labels,
}: CloseShiftModalProps) {
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Set once the close lands — the modal switches from form to result.
  const [closed, setClosed] = useState<ShiftSession | null>(null);

  useEffect(() => {
    if (!open) return;
    setCounted('');
    setNotes('');
    setError(null);
    setClosed(null);
  }, [open]);

  async function handleSubmit() {
    const value = counted.trim();
    if (!value) return setError(labels.errRequired);
    if (!isValidCashCount(value)) return setError(labels.errInvalid);

    setError(null);
    try {
      const result = await onCloseShift({
        countedCash: value,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setClosed(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const title = closed
    ? labels.result.title
    : isMine
      ? labels.title
      : labels.titleOther.replace('{name}', session.user_name);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        closed ? (
          <div className="flex justify-end">
            <Button onClick={onClose}>{labels.result.done}</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isClosing}>
              {labels.cancel}
            </Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={isClosing}>
              {isClosing && <Loader2 size={15} className="animate-spin" />}
              {labels.submit}
            </Button>
          </div>
        )
      }
    >
      {closed ? (
        <CashResultPanel session={closed} currency={currency} labels={labels.result} />
      ) : (
        <>
          <p className="text-[14px] leading-relaxed text-ink-500">{labels.intro}</p>

          <label className="mt-5 block text-[13px] font-medium text-ink-700" htmlFor="counted-cash">
            {labels.counted}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="counted-cash"
              className="input flex-1 text-[16px] tabular-nums"
              inputMode="decimal"
              autoFocus
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder={labels.countedPlaceholder}
            />
            <span className="text-[13px] text-ink-500">{currency}</span>
          </div>
          <p className="mt-1.5 text-[12px] text-ink-400">{labels.countedHint}</p>

          <label className="mt-4 block text-[13px] font-medium text-ink-700" htmlFor="close-notes">
            {labels.notes}
          </label>
          <textarea
            id="close-notes"
            className="input mt-1.5 resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={labels.notesPlaceholder}
          />

          {error && <p className="mt-3 text-[13px] text-danger-700">{error}</p>}
        </>
      )}
    </Modal>
  );
}
