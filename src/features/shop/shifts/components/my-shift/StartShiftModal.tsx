'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { Button } from '@/common/components/ui/button';
import { isValidCashCount } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { OpenShiftInput } from '../../types/shifts.types';

interface StartShiftModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Last closed shift's hand count, offered as the float — that hand-off is what
   * keeps the money chain intact between shifts. Null when there is nothing to
   * suggest, in which case the field starts empty: an empty box asks for a
   * count, a pre-filled "0.00" asserts one that nobody made.
   */
  suggestedFloat: string | null;
  onStart: (data: OpenShiftInput) => Promise<unknown>;
  isStarting: boolean;
  currency: string;
  labels: {
    title: string;
    intro: string;
    float: string;
    floatPlaceholder: string;
    floatHint: string;
    floatHintNoSuggestion: string;
    submit: string;
    cancel: string;
    errRequired: string;
    errInvalid: string;
  };
}

export function StartShiftModal({
  open,
  onClose,
  suggestedFloat,
  onStart,
  isStarting,
  currency,
  labels,
}: StartShiftModalProps) {
  const [float, setFloat] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFloat(suggestedFloat ?? '');
    setError(null);
  }, [open, suggestedFloat]);

  async function handleSubmit() {
    const value = float.trim();
    if (!value) return setError(labels.errRequired);
    if (!isValidCashCount(value)) return setError(labels.errInvalid);

    setError(null);
    try {
      await onStart({ openingFloat: value });
      onClose();
    } catch (err) {
      // Includes the 409 naming whoever's shift is still open — the server's
      // message is already localised, so it is rendered as-is.
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={labels.title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isStarting}>
            {labels.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isStarting}>
            {isStarting && <Loader2 size={15} className="animate-spin" />}
            {labels.submit}
          </Button>
        </div>
      }
    >
      <p className="text-[14px] leading-relaxed text-ink-500">{labels.intro}</p>

      <label className="mt-5 block text-[13px] font-medium text-ink-700" htmlFor="opening-float">
        {labels.float}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id="opening-float"
          className="input flex-1 text-[16px] tabular-nums"
          inputMode="decimal"
          autoFocus
          value={float}
          onChange={(e) => setFloat(e.target.value)}
          placeholder={labels.floatPlaceholder}
        />
        <span className="text-[13px] text-ink-500">{currency}</span>
      </div>
      <p className="mt-1.5 text-[12px] text-ink-400">
        {suggestedFloat ? labels.floatHint : labels.floatHintNoSuggestion}
      </p>

      {error && <p className="mt-3 text-[13px] text-danger-700">{error}</p>}
    </Modal>
  );
}
