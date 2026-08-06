'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, compareMoney, isValidMoneyInput } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { useI18n } from '@/providers/I18nProvider';
import { PaymentMethod, PAYMENT_NOTE_MAX_LENGTH } from '../types/debts.types';
import type { RecordPaymentInput } from '../types/debts.types';

interface RecordOrderPaymentModalProps {
  open: boolean;
  onClose: () => void;
  orderId: number;
  shopName: string;
  /** The server's remaining on this order — the ceiling for one payment. */
  remaining: string;
  onSubmit: (data: RecordPaymentInput) => Promise<unknown>;
  isSubmitting: boolean;
  onRecorded: () => void;
}

/**
 * Money the warehouse received from a shop for one order.
 *
 * Deliberately simpler than CollectPaymentModal: collecting from a customer
 * applies FIFO across many sales and returns a list of what it settled, so that
 * modal needs a target picker and a result view. `POST /orders/:id/payments`
 * settles exactly one debt, so this ends in a toast.
 */
export function RecordOrderPaymentModal({
  open,
  onClose,
  orderId,
  shopName,
  remaining,
  onSubmit,
  isSubmitting,
  onRecorded,
}: RecordOrderPaymentModalProps) {
  const { t } = useI18n();
  const l = t.debts.orderPayment;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [note, setNote] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setMethod(PaymentMethod.CASH);
    setNote('');
    setServerError(null);
  }, [open]);

  const trimmed = amount.trim();

  const amountError =
    trimmed === ''
      ? null
      : !isValidMoneyInput(trimmed)
        ? l.errInvalid
        : // Ceiling is the debt's remaining, never the order's total_price —
          // that one is a float and would drift against these string amounts.
          compareMoney(trimmed, remaining) > 0
          ? l.errExceeds.replace('{remaining}', formatMoney(remaining))
          : null;

  const canSubmit = trimmed !== '' && !amountError && !isSubmitting;

  async function handleSubmit() {
    setServerError(null);
    try {
      await onSubmit({
        amount: trimmed,
        method,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onRecorded();
    } catch (err) {
      // An over-payment 400 already names the true remaining, so show it as-is
      // rather than re-fetching the debt to say the same thing.
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={l.title} size="md">
      <p className="text-[14px] text-ink-600 mb-1">
        {l.intro.replace('{shop}', shopName).replace('{id}', String(orderId))}
      </p>
      <p className="text-[13px] text-ink-500 mb-4">
        {l.owedLabel}:{' '}
        <span className="font-mono font-bold text-amber-700 tabular-nums">
          {formatMoney(remaining)}
        </span>{' '}
        <span className="text-ink-400">{t.debts.currency}</span>
      </p>

      {serverError && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-danger-100 text-[13px] text-danger-700">
          {serverError}
        </p>
      )}

      {/* Amount */}
      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">{l.amount}</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        dir="ltr"
        autoFocus
        placeholder={l.amountPlaceholder}
        className={`w-full px-3 py-2 font-mono text-[15px] text-ink-900 placeholder:text-ink-400 bg-page border rounded-lg outline-none tabular-nums ${
          amountError ? 'border-danger-700' : 'border-border focus:border-amber-500'
        }`}
      />
      {amountError && <p className="mt-1 text-[12px] text-danger-700">{amountError}</p>}

      {/* Method */}
      <label className="block mt-4 mb-1.5 text-[12px] font-medium text-ink-500">{l.method}</label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        className="w-full h-9 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
      >
        {Object.values(PaymentMethod).map((m) => (
          <option key={m} value={m}>
            {t.debts.method[m]}
          </option>
        ))}
      </select>

      {/* Note */}
      <label className="block mt-4 mb-1.5 text-[12px] font-medium text-ink-500">{l.note}</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={PAYMENT_NOTE_MAX_LENGTH}
        placeholder={l.notePlaceholder}
        className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {l.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {l.submit}
        </button>
      </div>
    </Modal>
  );
}
