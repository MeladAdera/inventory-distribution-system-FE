'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Info } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, compareMoney, isValidMoneyInput } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { DebtStatusBadge } from '@/features/shared/debts';
import { PaymentMethod, DebtStatus } from '@/features/shared/debts';
import type { DebtListItem, PaymentApplication } from '@/features/shared/debts';
import type { CollectPaymentInput } from '../api/customers.api';

type Target = 'FIFO' | 'SPECIFIC';

interface CollectPaymentModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  /** Total still owed across every open sale — the ceiling for one payment. */
  totalRemaining: string;
  openDebts: DebtListItem[];
  onCollect: (data: CollectPaymentInput) => Promise<{ data: PaymentApplication[] }>;
  isCollecting: boolean;
  currency: string;
  labels: {
    title: string;
    intro: string;
    owedLabel: string;
    amount: string;
    amountPlaceholder: string;
    method: string;
    note: string;
    notePlaceholder: string;
    targetLabel: string;
    targetFifo: string;
    targetSpecific: string;
    fifoHint: string;
    debtOption: string;
    /** "Receipt #{id}" — used on its own in the result rows. */
    receiptLabel: string;
    submit: string;
    cancel: string;
    errRequired: string;
    errInvalid: string;
    errExceeds: string;
    resultTitle: string;
    resultIntro: string;
    resultSettled: string;
    resultRemaining: string;
    resultDone: string;
    methodNames: Record<PaymentMethod, string>;
    statusNames: Record<DebtStatus, string>;
  };
}

export function CollectPaymentModal({
  open,
  onClose,
  customerName,
  totalRemaining,
  openDebts,
  onCollect,
  isCollecting,
  currency,
  labels,
}: CollectPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState<Target>('FIFO');
  const [debtId, setDebtId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Set once the payment lands — the modal switches from form to receipt.
  const [applications, setApplications] = useState<PaymentApplication[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setMethod(PaymentMethod.CASH);
    setNote('');
    setTarget('FIFO');
    setDebtId(null);
    setServerError(null);
    setApplications(null);
  }, [open]);

  const trimmed = amount.trim();

  // When paying one specific sale the ceiling is that sale, not the whole balance.
  const selectedDebt = openDebts.find((d) => d.id === debtId) ?? null;
  const ceiling = target === 'SPECIFIC' && selectedDebt ? selectedDebt.remaining : totalRemaining;

  const amountError =
    trimmed === ''
      ? null
      : !isValidMoneyInput(trimmed)
        ? labels.errInvalid
        : compareMoney(trimmed, ceiling) > 0
          ? labels.errExceeds.replace('{remaining}', formatMoney(ceiling))
          : null;

  const canSubmit =
    trimmed !== '' &&
    !amountError &&
    !isCollecting &&
    (target === 'FIFO' || debtId !== null) &&
    openDebts.length > 0;

  async function handleSubmit() {
    setServerError(null);
    try {
      const result = await onCollect({
        amount: trimmed,
        method,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(target === 'SPECIFIC' && debtId !== null ? { debtId } : {}),
      });
      setApplications(result?.data ?? []);
    } catch (err) {
      // Covers debt.AMOUNT_EXCEEDS_REMAINING (nothing is applied — the request
      // is all-or-nothing) and debt.NO_OPEN_DEBTS. Message is already localized.
      setServerError(getErrorMessage(err));
    }
  }

  // ── Result view: what this payment actually settled ──
  if (applications) {
    return (
      <Modal open={open} onClose={onClose} title={labels.resultTitle} size="md">
        <div className="flex items-center gap-2 mb-4 text-success-700">
          <CheckCircle2 size={18} />
          <p className="text-[14px] font-medium">
            {labels.resultIntro.replace('{n}', String(applications.length))}
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border border border-border rounded-lg mb-4">
          {applications.map((a) => (
            <div key={a.debt_id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-medium text-ink-900">
                  {labels.receiptLabel.replace('{id}', String(a.receipt_id ?? a.debt_id))}
                </span>
                <span className="block text-[12px] text-ink-500">
                  {a.status === DebtStatus.PAID
                    ? labels.resultSettled
                    : labels.resultRemaining.replace('{remaining}', formatMoney(a.remaining))}
                </span>
              </span>
              <span className="font-mono text-[13px] font-bold text-ink-900 tabular-nums shrink-0">
                {formatMoney(a.amount)}
              </span>
              <DebtStatusBadge status={a.status} label={labels.statusNames[a.status]} small />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            {labels.resultDone}
          </button>
        </div>
      </Modal>
    );
  }

  // ── Form view ──
  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-1">
        {labels.intro.replace('{name}', customerName)}
      </p>
      <p className="text-[13px] text-ink-500 mb-4">
        {labels.owedLabel}:{' '}
        <span className="font-mono font-bold text-amber-700 tabular-nums">
          {formatMoney(totalRemaining)}
        </span>{' '}
        <span className="text-ink-400">{currency}</span>
      </p>

      {serverError && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-danger-100 text-[13px] text-danger-700">
          {serverError}
        </p>
      )}

      {/* Amount */}
      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">{labels.amount}</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        dir="ltr"
        autoFocus
        placeholder={labels.amountPlaceholder}
        className={`w-full px-3 py-2 font-mono text-[15px] text-ink-900 placeholder:text-ink-400 bg-page border rounded-lg outline-none tabular-nums ${
          amountError ? 'border-danger-700' : 'border-border focus:border-amber-500'
        }`}
      />
      {amountError && <p className="mt-1 text-[12px] text-danger-700">{amountError}</p>}

      {/* Where it goes */}
      <p className="mt-4 mb-1.5 text-[12px] font-medium text-ink-500">{labels.targetLabel}</p>
      <div className="flex gap-1 p-1 bg-page border border-border rounded-lg">
        {(
          [
            { value: 'FIFO', label: labels.targetFifo },
            { value: 'SPECIFIC', label: labels.targetSpecific },
          ] as { value: Target; label: string }[]
        ).map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setTarget(o.value);
              if (o.value === 'FIFO') setDebtId(null);
            }}
            className={`flex-1 h-8 rounded-md text-[12px] font-semibold transition-colors ${
              target === o.value ? 'bg-amber-600 text-white' : 'text-ink-600 hover:bg-sand-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {target === 'FIFO' ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-ink-400">
          <Info size={13} className="mt-0.5 shrink-0" />
          {labels.fifoHint}
        </p>
      ) : (
        <select
          value={debtId ?? ''}
          onChange={(e) => setDebtId(e.target.value ? Number(e.target.value) : null)}
          className="mt-2 w-full h-9 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="">—</option>
          {openDebts.map((d) => (
            <option key={d.id} value={d.id}>
              {labels.debtOption
                .replace('{id}', String(d.receipt_id ?? d.id))
                .replace('{remaining}', formatMoney(d.remaining))}
            </option>
          ))}
        </select>
      )}

      {/* Method */}
      <label className="block mt-4 mb-1.5 text-[12px] font-medium text-ink-500">
        {labels.method}
      </label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        className="w-full h-9 px-3 border border-border rounded-lg text-[13px] text-ink-700 bg-paper outline-none focus:border-amber-500 cursor-pointer"
      >
        {Object.values(PaymentMethod).map((m) => (
          <option key={m} value={m}>
            {labels.methodNames[m]}
          </option>
        ))}
      </select>

      {/* Note */}
      <label className="block mt-4 mb-1.5 text-[12px] font-medium text-ink-500">
        {labels.note}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder={labels.notePlaceholder}
        className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
      />

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isCollecting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isCollecting && <Loader2 size={14} className="animate-spin" />}
          {labels.submit}
        </button>
      </div>
    </Modal>
  );
}
