'use client';

import { useEffect, useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import {
  formatMoney,
  compareMoney,
  isValidMoneyInput,
  isPositiveMoney,
  subMoney,
} from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import type { CreateBillInput, SupplierBill } from '../types/suppliers.types';

interface RecordBillModalProps {
  open: boolean;
  onClose: () => void;
  supplierName: string;
  onRecord: (data: CreateBillInput) => Promise<{ data: SupplierBill }>;
  isRecording: boolean;
  currency: string;
  labels: {
    title: string;
    intro: string;
    invoiceNo: string;
    invoiceNoPlaceholder: string;
    invoiceNoHint: string;
    totalAmount: string;
    totalAmountPlaceholder: string;
    paidNow: string;
    paidNowPlaceholder: string;
    paidNowHint: string;
    remainingLabel: string;
    onCreditNote: string;
    note: string;
    notePlaceholder: string;
    submit: string;
    cancel: string;
    errInvalid: string;
    errPaidExceeds: string;
  };
}

/**
 * Record one bill against a supplier.
 *
 * A single form rather than the two-step "record, then pay" the API's shape
 * suggests: the shop owner is standing at the delivery with one set of facts —
 * what it cost and what they handed over — and splitting that across two
 * screens would ask them to describe one event twice.
 *
 * `paidAmount` is left empty by default, matching the server's default of 0, so
 * the buy-on-credit case needs no input at all.
 */
export function RecordBillModal({
  open,
  onClose,
  supplierName,
  onRecord,
  isRecording,
  currency,
  labels,
}: RecordBillModalProps) {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidNow, setPaidNow] = useState('');
  const [note, setNote] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setInvoiceNo('');
    setTotalAmount('');
    setPaidNow('');
    setNote('');
    setServerError(null);
  }, [open]);

  const total = totalAmount.trim();
  const paid = paidNow.trim();

  const totalError = total === '' || isValidMoneyInput(total) ? null : labels.errInvalid;

  const paidError =
    paid === ''
      ? null
      : !isValidMoneyInput(paid)
        ? labels.errInvalid
        : // Mirrors 400 supplier.PAID_EXCEEDS_TOTAL, caught before the request so
          // the number can be corrected in place rather than bounced back.
          totalError === null && total !== '' && compareMoney(paid, total) > 0
          ? labels.errPaidExceeds
          : null;

  // Only meaningful once a valid total is in — until then there is nothing to
  // subtract from and a running figure would just flicker.
  const remaining =
    totalError === null && total !== '' && paidError === null
      ? subMoney(total, paid === '' ? '0' : paid)
      : null;

  const canSubmit =
    total !== '' && isPositiveMoney(total) && !totalError && !paidError && !isRecording;

  async function handleSubmit() {
    setServerError(null);
    try {
      await onRecord({
        totalAmount: total,
        // Omit rather than send "0" — the server already defaults to it, and an
        // explicit zero would imply the shop chose to pay nothing rather than
        // simply not having said.
        ...(paid !== '' && isPositiveMoney(paid) ? { paidAmount: paid } : {}),
        ...(invoiceNo.trim() ? { invoiceNo: invoiceNo.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onClose();
    } catch (err) {
      // Covers 409 supplier.INVOICE_TAKEN — this bill is already on the books —
      // and 400 supplier.PAID_EXCEEDS_TOTAL. Localized server-side.
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">
        {labels.intro.replace('{name}', supplierName)}
      </p>

      {serverError && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-danger-100 text-[13px] text-danger-700">
          {serverError}
        </p>
      )}

      {/* Invoice number leads the form: optional, but it is what catches the
          same delivery being entered twice, so it should be the first thing
          reached for rather than something discovered at the bottom. */}
      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
        {labels.invoiceNo}
      </label>
      <input
        value={invoiceNo}
        onChange={(e) => setInvoiceNo(e.target.value)}
        dir="ltr"
        autoFocus
        placeholder={labels.invoiceNoPlaceholder}
        className="w-full px-3 py-2 font-mono text-[15px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500"
      />
      <p className="mt-1 flex items-start gap-1.5 text-[12px] text-ink-400">
        <Info size={13} className="mt-0.5 shrink-0" />
        {labels.invoiceNoHint}
      </p>

      {/* The two money facts of a delivery, side by side. */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
            {labels.totalAmount}
          </label>
          <input
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder={labels.totalAmountPlaceholder}
            className={`w-full px-3 py-2 font-mono text-[15px] text-ink-900 placeholder:text-ink-400 bg-page border rounded-lg outline-none tabular-nums ${
              totalError ? 'border-danger-700' : 'border-border focus:border-amber-500'
            }`}
          />
          {totalError && <p className="mt-1 text-[12px] text-danger-700">{totalError}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
            {labels.paidNow}
          </label>
          <input
            value={paidNow}
            onChange={(e) => setPaidNow(e.target.value)}
            inputMode="decimal"
            dir="ltr"
            placeholder={labels.paidNowPlaceholder}
            className={`w-full px-3 py-2 font-mono text-[15px] text-ink-900 placeholder:text-ink-400 bg-page border rounded-lg outline-none tabular-nums ${
              paidError ? 'border-danger-700' : 'border-border focus:border-amber-500'
            }`}
          />
          {paidError ? (
            <p className="mt-1 text-[12px] text-danger-700">{paidError}</p>
          ) : (
            <p className="mt-1 text-[12px] text-ink-400">{labels.paidNowHint}</p>
          )}
        </div>
      </div>

      {/* What the shop is left owing — the number this whole feature tracks, so
          it is shown as it is typed rather than revealed after saving. */}
      {remaining !== null && (
        <div className="flex items-baseline justify-between gap-3 mt-3 px-3.5 py-2.5 rounded-lg bg-page border border-border">
          <span className="text-[13px] text-ink-600">{labels.remainingLabel}</span>
          <span className="font-mono text-[15px] font-bold tabular-nums text-danger-700">
            {formatMoney(remaining)}{' '}
            <span className="font-sans text-[12px] font-normal text-ink-400">{currency}</span>
          </span>
        </div>
      )}

      {/* Says plainly that a bill with nothing paid is complete, not half-filled. */}
      {remaining !== null && paid === '' && (
        <p className="mt-1.5 text-[12px] text-ink-400">{labels.onCreditNote}</p>
      )}

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
          disabled={isRecording}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRecording && <Loader2 size={14} className="animate-spin" />}
          {labels.submit}
        </button>
      </div>
    </Modal>
  );
}
