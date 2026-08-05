'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Info } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, compareMoney, isValidMoneyInput } from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { DebtStatusBadge, DebtStatus } from '@/features/shared/debts';
import type { PaymentApplication } from '@/features/shared/debts';
import type { PaySupplierInput, SupplierBill } from '../types/suppliers.types';

type Target = 'FIFO' | 'SPECIFIC';

interface PaySupplierModalProps {
  open: boolean;
  onClose: () => void;
  supplierName: string;
  /** Total still owed across every open bill — the ceiling for one payment. */
  totalRemaining: string;
  openBills: SupplierBill[];
  onPay: (data: PaySupplierInput) => Promise<{ data: PaymentApplication[] }>;
  isPaying: boolean;
  /**
   * True while this supplier's bills are still being fetched. Opening the modal
   * straight from a list row starts that fetch, so without the guard the form
   * would flash "owe 0.00" and an empty bill picker before the real numbers
   * land — and a payment typed into that window would target nothing.
   */
  isLoadingBills?: boolean;
  currency: string;
  labels: {
    title: string;
    intro: string;
    owedLabel: string;
    amount: string;
    amountPlaceholder: string;
    payAllBtn: string;
    targetLabel: string;
    targetFifo: string;
    targetSpecific: string;
    fifoHint: string;
    billOption: string;
    billOptionNoInvoice: string;
    noOpenBills: string;
    submit: string;
    cancel: string;
    errInvalid: string;
    errExceeds: string;
    resultTitle: string;
    resultIntro: string;
    resultSettled: string;
    resultRemaining: string;
    resultDone: string;
    billRef: string;
    statusNames: Record<DebtStatus, string>;
  };
}

/**
 * Pay a supplier — across their oldest bills, or against one in particular.
 *
 * The mirror of CollectPaymentModal, minus the method and note fields:
 * `CreateSupplierPaymentDto` accepts only an amount and an optional bill id.
 */
export function PaySupplierModal({
  open,
  onClose,
  supplierName,
  totalRemaining,
  openBills,
  onPay,
  isPaying,
  isLoadingBills = false,
  currency,
  labels,
}: PaySupplierModalProps) {
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState<Target>('FIFO');
  const [debtId, setDebtId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Set once the payment lands — the modal switches from form to receipt.
  const [applications, setApplications] = useState<PaymentApplication[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setTarget('FIFO');
    setDebtId(null);
    setServerError(null);
    setApplications(null);
  }, [open]);

  const trimmed = amount.trim();

  // When paying one specific bill the ceiling is that bill, not the whole balance.
  const selectedBill = openBills.find((b) => b.id === debtId) ?? null;
  const ceiling = target === 'SPECIFIC' && selectedBill ? selectedBill.remaining : totalRemaining;

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
    !isPaying &&
    (target === 'FIFO' || debtId !== null) &&
    openBills.length > 0;

  /** Settling up is the common case, so it shouldn't need retyping the balance. */
  function fillCeiling() {
    setAmount(ceiling);
  }

  /** "INV-882 — 50.00 left", or a bill number when the invoice was never given. */
  function billLabel(bill: SupplierBill): string {
    const template = bill.invoice_no ? labels.billOption : labels.billOptionNoInvoice;
    return template
      .replace('{invoice}', bill.invoice_no ?? '')
      .replace('{id}', String(bill.id))
      .replace('{remaining}', formatMoney(bill.remaining));
  }

  async function handleSubmit() {
    setServerError(null);
    try {
      const result = await onPay({
        amount: trimmed,
        ...(target === 'SPECIFIC' && debtId !== null ? { debtId } : {}),
      });
      setApplications(result?.data ?? []);
    } catch (err) {
      // Covers 404 debt.NO_OPEN_SUPPLIER_DEBTS and an over-payment, which is
      // all-or-nothing server-side. Message is already localized.
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
          {applications.map((a) => {
            // The response carries only ids, so the invoice number is resolved
            // from the bills the modal already holds — a shop owner recognises
            // "INV-882", not "bill 24".
            const bill = openBills.find((b) => b.id === a.debt_id) ?? null;
            return (
              <div key={a.debt_id} className="flex items-center gap-3 px-3.5 py-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium text-ink-900 truncate">
                    {bill?.invoice_no ? (
                      <bdi className="font-mono">{bill.invoice_no}</bdi>
                    ) : (
                      labels.billRef.replace('{id}', String(a.debt_id))
                    )}
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
            );
          })}
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

  // ── Waiting on this supplier's open bills ──
  if (isLoadingBills) {
    return (
      <Modal open={open} onClose={onClose} title={labels.title} size="md">
        <div className="flex items-center justify-center py-12 text-ink-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </Modal>
    );
  }

  // ── Nothing to pay ──
  if (openBills.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title={labels.title} size="md">
        <p className="text-[13px] text-ink-500 py-8 text-center bg-page border border-border rounded-xl">
          {labels.noOpenBills.replace('{name}', supplierName)}
        </p>
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
          >
            {labels.cancel}
          </button>
        </div>
      </Modal>
    );
  }

  // ── Form view ──
  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-1">
        {labels.intro.replace('{name}', supplierName)}
      </p>
      <p className="text-[13px] text-ink-500 mb-4">
        {labels.owedLabel}:{' '}
        <span className="font-mono font-bold text-danger-700 tabular-nums">
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
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-[12px] font-medium text-ink-500">{labels.amount}</label>
        <button
          type="button"
          onClick={fillCeiling}
          className="text-[12px] font-semibold text-amber-700 hover:text-amber-600 transition-colors cursor-pointer"
        >
          {labels.payAllBtn}
        </button>
      </div>
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
          {openBills.map((b) => (
            <option key={b.id} value={b.id}>
              {billLabel(b)}
            </option>
          ))}
        </select>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onClose}
          disabled={isPaying}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPaying && <Loader2 size={14} className="animate-spin" />}
          {labels.submit}
        </button>
      </div>
    </Modal>
  );
}
