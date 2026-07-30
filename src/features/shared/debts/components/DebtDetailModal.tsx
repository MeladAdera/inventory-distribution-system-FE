'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/common/components/Modal';
import { formatMoney } from '@/common/utils/money';
import { useDebtDetail, useDebtPayments } from '../hooks/useDebts';
import { DebtStatusBadge } from './DebtStatusBadge';
import { PaymentHistoryList } from './PaymentHistoryList';
import { ReversePaymentModal } from './ReversePaymentModal';
import { DebtStatus, PaymentMethod } from '../types/debts.types';
import type { DebtListItem, DebtPaymentRow } from '../types/debts.types';

function formatDate(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface DebtDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** The list row that was clicked — used for the header while detail loads. */
  debt: DebtListItem | null;
  /** False for roles that may not reverse (employees), hiding the action outright. */
  canReverse: boolean;
  onReversed?: () => void;
  locale: 'ar' | 'en';
  currency: string;
  labels: {
    title: string;
    debtor: string;
    creditor: string;
    total: string;
    paid: string;
    remaining: string;
    created: string;
    note: string;
    historyTitle: string;
    noPayments: string;
    reversalOf: string;
    reversedBadge: string;
    reverseBtn: string;
    close: string;
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

export function DebtDetailModal({
  open,
  onClose,
  debt,
  canReverse,
  onReversed,
  locale,
  currency,
  labels,
}: DebtDetailModalProps) {
  const debtId = open ? (debt?.id ?? null) : null;
  const { debt: detail, isLoading } = useDebtDetail(debtId);
  const {
    payments,
    isLoading: isLoadingPayments,
    reversePayment,
    isReversing,
  } = useDebtPayments(debtId);

  const [reversing, setReversing] = useState<DebtPaymentRow | null>(null);

  // Fall back to the list row so the header isn't blank on first paint.
  const shown = detail ?? debt;

  async function handleReverse(reason?: string) {
    if (!reversing) return;
    await reversePayment({ paymentId: reversing.id, reason });
    onReversed?.();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${labels.title} #${debt?.id ?? ''}`} size="lg">
        {isLoading || !shown ? (
          <div className="flex items-center justify-center py-12 text-ink-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Field label={labels.debtor}>
                <span className="font-medium">{debt?.debtor_name ?? '—'}</span>
              </Field>
              <DebtStatusBadge status={shown.status} label={labels.statusNames[shown.status]} />
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-page border border-border rounded-xl">
              <Field label={labels.total}>
                <span className="font-mono font-bold tabular-nums">
                  {formatMoney(shown.total_amount)}
                </span>
              </Field>
              <Field label={labels.paid}>
                <span className="font-mono font-bold tabular-nums text-success-700">
                  {formatMoney(shown.paid_amount)}
                </span>
              </Field>
              <Field label={labels.remaining}>
                <span className="font-mono font-bold tabular-nums text-amber-700">
                  {formatMoney(shown.remaining)}{' '}
                  <span className="font-sans font-normal text-[12px] text-ink-400">{currency}</span>
                </span>
              </Field>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Field label={labels.created}>
                <span className="text-[13px] text-ink-600">
                  {formatDate(shown.created_at, locale)}
                </span>
              </Field>
              {shown.note && (
                <Field label={labels.note}>
                  <span className="text-[13px] text-ink-600">{shown.note}</span>
                </Field>
              )}
            </div>

            {isLoadingPayments ? (
              <div className="flex items-center justify-center py-8 text-ink-500">
                <Loader2 size={16} className="animate-spin" />
              </div>
            ) : (
              <PaymentHistoryList
                payments={payments}
                onReverse={canReverse ? setReversing : undefined}
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

        <div className="flex justify-end pt-4 border-t border-border mt-4">
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
    </>
  );
}
