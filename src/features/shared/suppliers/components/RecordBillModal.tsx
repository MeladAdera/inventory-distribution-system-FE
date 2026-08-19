'use client';

import { useEffect, useState } from 'react';
import { Loader2, Info, Receipt, PackagePlus } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import {
  formatMoney,
  compareMoney,
  isValidMoneyInput,
  isPositiveMoney,
  subMoney,
} from '@/common/utils/money';
import { getErrorMessage } from '@/common/utils/error.utils';
import { ProductPicker } from '@/features/shared/products/components/ProductPicker';
import { QuickProductModal } from '@/features/shared/products/components/QuickProductModal';
import type { Product } from '@/features/shared/products/types/products.types';
import { useBillDraft } from '../hooks/useBillDraft';
import { BillItemsTable, type BillItemsTableLabels } from './BillItemsTable';
import type { BillWithItems, CreateBillInput } from '../types/suppliers.types';

/**
 * Money-only, or money plus the goods it paid for.
 *
 * Both are legitimate bills. Rent, a delivery charge and a service invoice have
 * nothing to stock, and the API wants `items` omitted entirely for those — so
 * the choice is offered rather than inferred.
 */
type BillMode = 'MONEY' | 'GOODS';

interface RecordBillModalProps {
  open: boolean;
  onClose: () => void;
  supplierName: string;
  onRecord: (data: CreateBillInput) => Promise<{ data: BillWithItems }>;
  isRecording: boolean;
  currency: string;
  labels: {
    title: string;
    intro: string;
    modeMoney: string;
    modeGoods: string;
    modeMoneyHint: string;
    modeGoodsHint: string;
    goodsTitle: string;
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
    taxHint: string;
    note: string;
    notePlaceholder: string;
    submit: string;
    cancel: string;
    errInvalid: string;
    errPaidExceeds: string;
    items: BillItemsTableLabels;
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
 * The same reasoning extends to the goods. Recording what arrived used to mean
 * a second trip through the inventory page, once per product, with nothing
 * tying the stock to the bill; now the lines ride along on the same request and
 * are stocked in the same transaction.
 *
 * In goods mode the invoice total is NOT asked for. The server requires the
 * lines to sum to it exactly, so the form states the sum instead of collecting
 * a second figure and refusing to proceed until the two agree.
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
  const [mode, setMode] = useState<BillMode>('MONEY');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidNow, setPaidNow] = useState('');
  const [note, setNote] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [quickCreateFor, setQuickCreateFor] = useState<string | null>(null);

  const draft = useBillDraft();
  const { reset: resetDraft } = draft;

  useEffect(() => {
    if (!open) return;
    setMode('MONEY');
    setInvoiceNo('');
    setTotalAmount('');
    setPaidNow('');
    setNote('');
    setServerError(null);
    setQuickCreateFor(null);
    resetDraft();
  }, [open, resetDraft]);

  const isGoods = mode === 'GOODS';
  const typedTotal = totalAmount.trim();
  const paid = paidNow.trim();

  // In goods mode the lines ARE the total; the typed field isn't even rendered.
  const total = isGoods ? draft.computedTotal : typedTotal;
  const hasTotal = isGoods ? draft.hasLines : typedTotal !== '';

  const totalError =
    isGoods || typedTotal === '' || isValidMoneyInput(typedTotal) ? null : labels.errInvalid;

  const paidError =
    paid === ''
      ? null
      : !isValidMoneyInput(paid)
        ? labels.errInvalid
        : // Mirrors 400 supplier.PAID_EXCEEDS_TOTAL, caught before the request so
          // the number can be corrected in place rather than bounced back.
          totalError === null && hasTotal && compareMoney(paid, total) > 0
          ? labels.errPaidExceeds
          : null;

  // Only meaningful once there is a total to subtract from — until then a
  // running figure would just flicker between zeros.
  const remaining =
    totalError === null && hasTotal && paidError === null
      ? subMoney(total, paid === '' ? '0' : paid)
      : null;

  const canSubmit =
    !isRecording &&
    !paidError &&
    (isGoods
      ? // Every §5 rule the client can check lives in the draft hook; the sum
        // rule is satisfied by construction.
        draft.isValid
      : typedTotal !== '' && isPositiveMoney(typedTotal) && !totalError);

  function handlePick(product: Product) {
    // A known buying price saves typing it again. Warehouse products come back
    // with `cost_price: null` for shop users, and the catalog can hold a zero,
    // so only a genuinely usable figure is prefilled.
    const seed =
      product.cost_price && isValidMoneyInput(product.cost_price) ? product.cost_price : undefined;
    draft.addProduct({ id: product.id, name: product.name }, seed);
  }

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
        // Omitted entirely in money mode — an empty array would still read as
        // "a delivery that brought nothing".
        ...(isGoods ? { items: draft.toItems() } : {}),
      });
      onClose();
    } catch (err) {
      // Covers 409 supplier.INVOICE_TAKEN — this bill is already on the books —
      // and, with items, the line-level 400/403/404s. All localized server-side.
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={labels.title} size={isGoods ? 'xl' : 'md'}>
        <p className="mb-4 text-[14px] text-ink-600">
          {labels.intro.replace('{name}', supplierName)}
        </p>

        {/* The choice leads the form because it changes what the rest of it
            asks for — switching after filling everything in would be a worse
            surprise than deciding up front. Typed values survive the switch. */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <ModeButton
              active={!isGoods}
              icon={<Receipt size={14} />}
              label={labels.modeMoney}
              onClick={() => setMode('MONEY')}
            />
            <ModeButton
              active={isGoods}
              icon={<PackagePlus size={14} />}
              label={labels.modeGoods}
              onClick={() => setMode('GOODS')}
            />
          </div>
          <p className="mt-1.5 text-[12px] text-ink-400">
            {isGoods ? labels.modeGoodsHint : labels.modeMoneyHint}
          </p>
        </div>

        {serverError && (
          <p className="mb-3 rounded-lg bg-danger-100 px-3 py-2 text-[13px] text-danger-700">
            {serverError}
          </p>
        )}

        {/* Invoice number leads the fields: optional, but it is what catches the
            same delivery being entered twice, so it should be the first thing
            reached for rather than something discovered at the bottom. */}
        <label className="mb-1.5 block text-[12px] font-medium text-ink-500">
          {labels.invoiceNo}
        </label>
        <input
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          dir="ltr"
          autoFocus
          placeholder={labels.invoiceNoPlaceholder}
          className="w-full rounded-lg border border-border bg-page px-3 py-2 font-mono text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-amber-500"
        />
        <p className="mt-1 flex items-start gap-1.5 text-[12px] text-ink-400">
          <Info size={13} className="mt-0.5 shrink-0" />
          {labels.invoiceNoHint}
        </p>

        {isGoods ? (
          <div className="mt-5">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-ink-400">
              {labels.goodsTitle}
            </h3>

            <ProductPicker
              onPick={handlePick}
              onCreateNew={(term) => setQuickCreateFor(term)}
              takenIds={draft.productIds}
              disabled={draft.isFull}
            />

            <div className="mt-3">
              <BillItemsTable
                lines={draft.lines}
                flashKey={draft.flashKey}
                isFull={draft.isFull}
                currency={currency}
                labels={labels.items}
                onUpdate={draft.updateLine}
                onRemove={draft.removeLine}
              />
            </div>

            {/* Stated once the total exists, because that is when folding a
                charge into the lines is still an option. There are no
                tax/shipping fields on the API yet. */}
            {draft.hasLines && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-ink-400">
                <Info size={13} className="mt-0.5 shrink-0" />
                {labels.taxHint}
              </p>
            )}

            <label className="mb-1.5 mt-4 block text-[12px] font-medium text-ink-500">
              {labels.paidNow}
            </label>
            <input
              value={paidNow}
              onChange={(e) => setPaidNow(e.target.value)}
              inputMode="decimal"
              dir="ltr"
              placeholder={labels.paidNowPlaceholder}
              className={`w-full rounded-lg border bg-page px-3 py-2 font-mono text-[15px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 sm:max-w-[50%] ${
                paidError ? 'border-danger-700' : 'border-border focus:border-amber-500'
              }`}
            />
            {paidError ? (
              <p className="mt-1 text-[12px] text-danger-700">{paidError}</p>
            ) : (
              <p className="mt-1 text-[12px] text-ink-400">{labels.paidNowHint}</p>
            )}
          </div>
        ) : (
          /* The two money facts of a delivery, side by side. */
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-ink-500">
                {labels.totalAmount}
              </label>
              <input
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder={labels.totalAmountPlaceholder}
                className={`w-full rounded-lg border bg-page px-3 py-2 font-mono text-[15px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 ${
                  totalError ? 'border-danger-700' : 'border-border focus:border-amber-500'
                }`}
              />
              {totalError && <p className="mt-1 text-[12px] text-danger-700">{totalError}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-ink-500">
                {labels.paidNow}
              </label>
              <input
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                placeholder={labels.paidNowPlaceholder}
                className={`w-full rounded-lg border bg-page px-3 py-2 font-mono text-[15px] tabular-nums text-ink-900 outline-none placeholder:text-ink-400 ${
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
        )}

        {/* What the shop is left owing — the number this whole feature tracks, so
            it is shown as it is typed rather than revealed after saving. */}
        {remaining !== null && (
          <div className="mt-3 flex items-baseline justify-between gap-3 rounded-lg border border-border bg-page px-3.5 py-2.5">
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

        <label className="mb-1.5 mt-4 block text-[12px] font-medium text-ink-500">
          {labels.note}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={labels.notePlaceholder}
          className="w-full resize-none rounded-lg border border-border bg-page px-3 py-2 text-[13px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-amber-500"
        />

        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={onClose}
            disabled={isRecording}
            className="rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-ink-700 transition-colors hover:bg-sand-100 disabled:opacity-60"
          >
            {labels.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRecording && <Loader2 size={14} className="animate-spin" />}
            {labels.submit}
          </button>
        </div>
      </Modal>

      <QuickProductModal
        open={quickCreateFor !== null}
        onClose={() => setQuickCreateFor(null)}
        initialName={quickCreateFor ?? ''}
        onCreated={(product, unitCost) => draft.addProduct(product, unitCost)}
      />
    </>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? 'border-amber-500 bg-amber-50 text-amber-800'
          : 'border-border bg-paper text-ink-600 hover:bg-sand-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
