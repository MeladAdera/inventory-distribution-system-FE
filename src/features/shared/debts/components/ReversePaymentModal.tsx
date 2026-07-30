'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { REVERSE_REASON_MAX_LENGTH } from '../types/debts.types';
import type { DebtPaymentRow } from '../types/debts.types';

interface ReversePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: DebtPaymentRow | null;
  onConfirm: (reason?: string) => Promise<unknown>;
  isReversing: boolean;
  locale: 'ar' | 'en';
  labels: {
    title: string;
    description: string;
    amountLine: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    confirm: string;
    cancel: string;
  };
}

export function ReversePaymentModal({
  open,
  onClose,
  payment,
  onConfirm,
  isReversing,
  locale,
  labels,
}: ReversePaymentModalProps) {
  const [reason, setReason] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setServerError(null);
  }, [open]);

  async function handleConfirm() {
    setServerError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      onClose();
    } catch (err) {
      // debt.ALREADY_REVERSED / debt.NOT_REVERSIBLE shouldn't reach here — the
      // button isn't offered in those cases — but a second tab could race us.
      // Keep the dialog open so the typed reason survives.
      setServerError(getErrorMessage(err));
    }
  }

  const paidOn = payment
    ? new Date(payment.paid_at).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="sm">
      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-warning-100 text-warning-700 mb-3">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <p className="text-[13px]">{labels.description}</p>
      </div>

      {payment && (
        <p className="text-[13px] text-ink-600 mb-3">
          {labels.amountLine
            .replace('{amount}', formatMoney(payment.amount))
            .replace('{date}', paidOn)}
        </p>
      )}

      {serverError && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-danger-100 text-[13px] text-danger-700">
          {serverError}
        </p>
      )}

      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
        {labels.reasonLabel}
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={REVERSE_REASON_MAX_LENGTH}
        placeholder={labels.reasonPlaceholder}
        className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isReversing}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isReversing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-700 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isReversing && <Loader2 size={14} className="animate-spin" />}
          {labels.confirm}
        </button>
      </div>
    </Modal>
  );
}
