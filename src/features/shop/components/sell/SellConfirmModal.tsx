import { useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney, compareMoney, isValidMoneyInput, subMoney } from '@/common/utils/money';
import { ProductThumb } from '@/features/shared/products/components/ProductThumb';
import { CustomerPicker } from '@/features/shop/customers/components/CustomerPicker';
import type { Customer } from '@/features/shop/customers';
import type { SellTrayItem } from './SellTray';

/** How the customer is settling up at the moment of sale. */
export type SellPaymentMode = 'PAID' | 'PARTIAL' | 'CREDIT';

export interface SellConfirmPayload {
  notes: string;
  isFree: boolean;
  /** Both omitted on a normal fully-paid sale. */
  customerId?: number;
  paidAmount?: string;
}

interface SellConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: SellConfirmPayload) => Promise<void>;
  items: SellTrayItem[];
  totalUnits: number;
  totalPrice: number;
  /** Exact tray total as a money string — the basis for every credit calculation. */
  totalMoney: string;
  customers: Customer[];
  isOnline: boolean;
  isSubmitting: boolean;
  labels: {
    title: string;
    intro: string;
    totalUnits: string;
    totalPrice: string;
    notesLabel: string;
    notesPlaceholder: string;
    confirmBtn: string;
    cancelBtn: string;
    markFreeLabel: string;
    markFreeHint: string;
    credit: {
      modeLabel: string;
      modePaid: string;
      modePartial: string;
      modeCredit: string;
      customerLabel: string;
      customerRequired: string;
      customerSearch: string;
      customerNone: string;
      customerOwes: string;
      paidLabel: string;
      remainingLabel: string;
      errInvalid: string;
      errExceeds: string;
      creditBlocksFree: string;
      offlineHint: string;
    };
  };
}

export function SellConfirmModal({
  open,
  onClose,
  onConfirm,
  items,
  totalUnits,
  totalPrice,
  totalMoney,
  customers,
  isOnline,
  isSubmitting,
  labels,
}: SellConfirmModalProps) {
  const [notes, setNotes] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [mode, setMode] = useState<SellPaymentMode>('PAID');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paidInput, setPaidInput] = useState('');

  const c = labels.credit;
  const isCredit = mode !== 'PAID';
  const trimmedPaid = paidInput.trim();

  const amountError =
    mode === 'PARTIAL' && trimmedPaid !== ''
      ? !isValidMoneyInput(trimmedPaid)
        ? c.errInvalid
        : compareMoney(trimmedPaid, totalMoney) > 0
          ? c.errExceeds
          : null
      : null;

  const needsCustomer = isCredit && customerId === null;
  const needsAmount = mode === 'PARTIAL' && trimmedPaid === '';

  const canSubmit =
    items.length > 0 && !isSubmitting && !amountError && !needsCustomer && !needsAmount;

  function resetAll() {
    setNotes('');
    setIsFree(false);
    setMode('PAID');
    setCustomerId(null);
    setPaidInput('');
  }

  function handleClose() {
    if (isSubmitting) return;
    resetAll();
    onClose();
  }

  function handleModeChange(next: SellPaymentMode) {
    setMode(next);
    // A credit sale can't also be free — the backend rejects marking a
    // paid-against receipt free, and "free" already means nothing is owed.
    if (next !== 'PAID') setIsFree(false);
    if (next !== 'PARTIAL') setPaidInput('');
  }

  async function handleConfirm() {
    try {
      await onConfirm({
        notes,
        isFree,
        // A full-credit sale sends "0.00"; a partial sends what was typed.
        ...(isCredit && customerId !== null
          ? { customerId, paidAmount: mode === 'PARTIAL' ? trimmedPaid : '0.00' }
          : {}),
      });
      resetAll();
    } catch {
      // onConfirm showed the error toast; keep the form so the user can retry
    }
  }

  const modes: { value: SellPaymentMode; label: string }[] = [
    { value: 'PAID', label: c.modePaid },
    { value: 'PARTIAL', label: c.modePartial },
    { value: 'CREDIT', label: c.modeCredit },
  ];

  return (
    <Modal open={open} onClose={handleClose} title={labels.title} size="md">
      <p className="text-[14px] text-ink-600 mb-4">{labels.intro}</p>

      <div className="flex flex-col max-h-40 overflow-y-auto mb-4">
        {items.map(({ item, qty }) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            <ProductThumb id={item.product_id} size={28} />
            <span className="flex-1 text-[14px] text-ink-800 truncate">{item.product_name}</span>
            <span className="font-mono text-[13px] font-semibold text-ink-900 shrink-0">
              ×{qty}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-ink-600 mb-1">
        {labels.totalUnits}:{' '}
        <span className="font-mono font-bold text-ink-900 tabular-nums">{totalUnits}</span>
      </p>
      <p className="text-[13px] text-ink-600 mb-4">
        {labels.totalPrice}:{' '}
        <span className="font-mono font-bold text-amber-600 tabular-nums">
          {formatMoney(totalPrice)}
        </span>
      </p>

      {/* ── Payment mode ── */}
      <p className="text-[12px] font-medium text-ink-500 mb-1.5">{c.modeLabel}</p>
      <div className="flex gap-1 p-1 bg-page border border-border rounded-lg mb-3">
        {modes.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => handleModeChange(m.value)}
            className={`flex-1 h-8 rounded-md text-[12px] font-semibold transition-colors ${
              mode === m.value ? 'bg-amber-600 text-white' : 'text-ink-600 hover:bg-sand-100'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isCredit && (
        <div className="flex flex-col gap-3 mb-3 p-3 bg-page border border-border rounded-lg">
          <CustomerPicker
            customers={customers}
            selectedId={customerId}
            onSelect={setCustomerId}
            labels={{
              label: c.customerLabel,
              searchPlaceholder: c.customerSearch,
              none: c.customerNone,
              owes: c.customerOwes,
            }}
          />

          {mode === 'PARTIAL' && (
            <div>
              <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
                {c.paidLabel}
              </label>
              <input
                value={paidInput}
                onChange={(e) => setPaidInput(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder="0.00"
                className={`w-full px-3 py-2 font-mono text-[14px] text-ink-900 placeholder:text-ink-400 bg-paper border rounded-lg outline-none tabular-nums ${
                  amountError ? 'border-danger-700' : 'border-border focus:border-amber-500'
                }`}
              />
              {amountError ? (
                <p className="mt-1 text-[12px] text-danger-700">{amountError}</p>
              ) : (
                trimmedPaid !== '' && (
                  <p className="mt-1 text-[12px] text-ink-500">
                    {c.remainingLabel}:{' '}
                    <span className="font-mono font-bold text-amber-700 tabular-nums">
                      {formatMoney(subMoney(totalMoney, trimmedPaid))}
                    </span>
                  </p>
                )
              )}
            </div>
          )}

          {mode === 'CREDIT' && (
            <p className="text-[12px] text-ink-500">
              {c.remainingLabel}:{' '}
              <span className="font-mono font-bold text-amber-700 tabular-nums">
                {formatMoney(totalMoney)}
              </span>
            </p>
          )}

          {needsCustomer && customers.length > 0 && (
            <p className="text-[12px] text-ink-400">{c.customerRequired}</p>
          )}
          {!isOnline && <p className="text-[12px] text-ink-400">{c.offlineHint}</p>}
        </div>
      )}

      <label className="block text-[12px] font-medium text-ink-500 mb-1.5">
        {labels.notesLabel}
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={labels.notesPlaceholder}
        rows={2}
        className="w-full px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 bg-page border border-border rounded-lg outline-none focus:border-amber-500 resize-none"
      />

      <label
        className={`flex items-start gap-2 mt-3 ${isCredit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          checked={isFree}
          disabled={isCredit}
          onChange={(e) => setIsFree(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-amber-600 shrink-0"
        />
        <span>
          <span className="block text-[13px] font-medium text-ink-700">{labels.markFreeLabel}</span>
          <span className="block text-[12px] text-ink-400">
            {isCredit ? c.creditBlocksFree : labels.markFreeHint}
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-60"
        >
          {labels.cancelBtn}
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-[14px] font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
          {labels.confirmBtn}
        </button>
      </div>
    </Modal>
  );
}
