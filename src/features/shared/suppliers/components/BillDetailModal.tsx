'use client';

import { useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney } from '@/common/utils/money';
import {
  DebtStatusBadge,
  PaymentHistoryList,
  ReversePaymentModal,
  DebtStatus,
  PaymentMethod,
} from '@/features/shared/debts';
import type { DebtPaymentRow } from '@/features/shared/debts';
import { useSupplierBill } from '../hooks/useSupplierBill';
import { CancelBillModal } from './CancelBillModal';
import type { SupplierBill } from '../types/suppliers.types';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface BillDetailModalProps {
  open: boolean;
  onClose: () => void;
  bill: SupplierBill | null;
  locale: 'ar' | 'en';
  currency: string;
  labels: {
    title: string;
    invoiceNo: string;
    noInvoiceNo: string;
    billRef: string;
    total: string;
    paid: string;
    remaining: string;
    created: string;
    note: string;
    cancelBtn: string;
    cancelledNote: string;
    close: string;
    historyTitle: string;
    noPayments: string;
    reversalOf: string;
    reversedBadge: string;
    reverseBtn: string;
    statusNames: Record<DebtStatus, string>;
    methodNames: Record<PaymentMethod, string>;
    reverse: {
      title: string;
      description: string;
      amountLine: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      confirm: string;
      cancel: string;
    };
    cancelBill: {
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
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">{label}</p>
      <div className="text-[14px] text-ink-900">{children}</div>
    </div>
  );
}

/**
 * One bill: what it was for, what has been paid against it, and the two ways to
 * take something back.
 *
 * A payables-only counterpart to DebtDetailModal rather than a reuse of it —
 * that one is keyed to a receivable's shape (a debtor name, no invoice number)
 * and offers no cancel, which the API refuses on receivables anyway.
 */
export function BillDetailModal({
  open,
  onClose,
  bill,
  locale,
  currency,
  labels,
}: BillDetailModalProps) {
  const billId = open ? (bill?.id ?? null) : null;
  const {
    payments,
    isLoading: isLoadingPayments,
    reversePayment,
    isReversing,
    cancelBill,
    isCancelling,
  } = useSupplierBill(billId);

  const [reversing, setReversing] = useState<DebtPaymentRow | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Only PENDING or PARTIAL bills may be voided. A settled one is history, and a
  // cancelled one would come back 400 debt.ALREADY_CANCELLED — so rather than
  // explain either, the action simply isn't offered.
  const canCancel =
    bill !== null && bill.status !== DebtStatus.PAID && bill.status !== DebtStatus.CANCELLED;

  async function handleReverse(reason?: string) {
    if (!reversing) return;
    await reversePayment({ paymentId: reversing.id, reason });
  }

  async function handleCancel(reason: string) {
    await cancelBill(reason);
    // The bill this modal is showing no longer exists as an obligation; there is
    // nothing left to look at, so step back to the supplier's account.
    onClose();
  }

  const heading = bill?.invoice_no
    ? bill.invoice_no
    : bill
      ? labels.billRef.replace('{id}', String(bill.id))
      : labels.title;

  return (
    <>
      <Modal open={open} onClose={onClose} title={heading} size="lg">
        {!bill ? (
          <div className="flex items-center justify-center py-12 text-ink-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Field label={labels.invoiceNo}>
                {bill.invoice_no ? (
                  <bdi className="font-mono font-medium">{bill.invoice_no}</bdi>
                ) : (
                  <span className="text-ink-500">{labels.noInvoiceNo}</span>
                )}
              </Field>
              <DebtStatusBadge status={bill.status} label={labels.statusNames[bill.status]} />
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-page border border-border rounded-xl">
              <Field label={labels.total}>
                <span className="font-mono font-bold tabular-nums">
                  {formatMoney(bill.total_amount)}
                </span>
              </Field>
              <Field label={labels.paid}>
                <span className="font-mono font-bold tabular-nums text-success-700">
                  {formatMoney(bill.paid_amount)}
                </span>
              </Field>
              <Field label={labels.remaining}>
                <span className="font-mono font-bold tabular-nums text-danger-700">
                  {formatMoney(bill.remaining)}{' '}
                  <span className="font-sans font-normal text-[12px] text-ink-400">{currency}</span>
                </span>
              </Field>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Field label={labels.created}>
                <span className="text-[13px] text-ink-600">
                  {formatDate(bill.created_at, locale)}
                </span>
              </Field>
              {bill.note && (
                <Field label={labels.note}>
                  <span className="text-[13px] text-ink-600">{bill.note}</span>
                </Field>
              )}
            </div>

            {bill.status === DebtStatus.CANCELLED && (
              <p className="px-3.5 py-2.5 rounded-lg bg-sand-100 text-[13px] text-ink-600">
                {labels.cancelledNote}
              </p>
            )}

            {isLoadingPayments ? (
              <div className="flex items-center justify-center py-8 text-ink-500">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              <PaymentHistoryList
                payments={payments}
                onReverse={setReversing}
                locale={locale}
                labels={{
                  historyTitle: labels.historyTitle,
                  noPayments: labels.noPayments,
                  reversalOf: labels.reversalOf,
                  reversedBadge: labels.reversedBadge,
                  reverseBtn: labels.reverseBtn,
                  methodNames: labels.methodNames,
                }}
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-4">
          {canCancel ? (
            <button
              onClick={() => setCancelOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-danger-700 text-[13px] font-medium text-danger-700 hover:bg-danger-100 transition-colors"
            >
              <Ban size={14} />
              {labels.cancelBtn}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-ink-700 hover:bg-sand-100 transition-colors"
          >
            {labels.close}
          </button>
        </div>
      </Modal>

      <ReversePaymentModal
        open={reversing !== null}
        onClose={() => setReversing(null)}
        payment={reversing}
        onConfirm={handleReverse}
        isReversing={isReversing}
        locale={locale}
        labels={labels.reverse}
      />

      <CancelBillModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        bill={bill}
        onConfirm={handleCancel}
        isCancelling={isCancelling}
        currency={currency}
        labels={labels.cancelBill}
      />
    </>
  );
}
