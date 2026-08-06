'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { CANCEL_REASON_MAX_LENGTH } from '@/features/shared/debts';
import type { SupplierBill } from '../types/suppliers.types';

interface CancelBillModalProps {
  open: boolean;
  onClose: () => void;
  bill: SupplierBill | null;
  onConfirm: (reason: string) => Promise<unknown>;
  isCancelling: boolean;
  currency: string;
  labels: {
    title: string;
    description: string;
    billLine: string;
    billLineNoInvoice: string;
    refundWarning: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    errReasonRequired: string;
    confirm: string;
    cancel: string;
  };
}

/**
 * Void a whole bill.
 *
 * The reason is required here, where reversing a payment leaves it optional.
 * Cancelling erases a delivery from the books entirely, and six months on the
 * only remaining explanation for why the numbers changed is this sentence.
 */
export function CancelBillModal({
  open,
  onClose,
  bill,
  onConfirm,
  isCancelling,
  currency,
  labels,
}: CancelBillModalProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setTouched(false);
    setServerError(null);
  }, [open]);

  const trimmed = reason.trim();
  const reasonError = touched && trimmed === '' ? labels.errReasonRequired : null;

  // Money already handed over doesn't come back on its own — say so before the
  // fact, since v1 reports the refund but has no way to settle it.
  const paidSomething = bill !== null && isPositiveMoney(bill.paid_amount);

  async function handleConfirm() {
    setTouched(true);
    if (trimmed === '') return;
    setServerError(null);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      // 400 debt.ALREADY_CANCELLED shouldn't reach here — the action isn't
      // offered on a cancelled bill — but a second tab could race us. Keep the
      // dialog open so the typed reason survives.
      setServerError(getErrorMessage(err));
    }
  }

  const billLine = bill
    ? (bill.invoice_no ? labels.billLine : labels.billLineNoInvoice)
        .replace('{invoice}', bill.invoice_no ?? '')
        .replace('{id}', String(bill.id))
        .replace('{amount}', formatMoney(bill.total_amount))
    : '';

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="sm">
      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-warning-100 text-warning-700 mb-3">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <p className="text-[13px]">{labels.description}</p>
      </div>

      {bill && <p className="text-[13px] text-ink-600 mb-3">{billLine}</p>}

      {paidSomething && bill && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-danger-100 text-[13px] text-danger-700">
          {labels.refundWarning.replace('{amount}', `${formatMoney(bill.paid_amount)} ${currency}`)}
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
        onBlur={() => setTouched(true)}
        rows={2}
        maxLength={CANCEL_REASON_MAX_LENGTH}
        placeholder={labels.reasonPlaceholder}
        className={`w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border rounded-lg outline-none resize-none ${
          reasonError ? 'border-danger-700' : 'border-border focus:border-amber-500'
        }`}
      />
      {reasonError && <p className="mt-1 text-[12px] text-danger-700">{reasonError}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isCancelling}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isCancelling}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger-700 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isCancelling && <Loader2 size={14} className="animate-spin" />}
          {labels.confirm}
        </button>
      </div>
    </Modal>
  );
}
