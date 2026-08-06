'use client';

import { Undo2, CornerDownRight } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { formatMoney } from '@/common/utils/money';
import { PaymentMethod } from '../types/debts.types';
import type { DebtPaymentRow } from '../types/debts.types';

function formatDateTime(iso: string, locale: 'ar' | 'en'): string {
  return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-SY-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface PaymentHistoryListProps {
  payments: DebtPaymentRow[];
  /** Omitted entirely for roles that may not reverse — never rely on the 403. */
  onReverse?: (payment: DebtPaymentRow) => void;
  locale: 'ar' | 'en';
  labels: {
    historyTitle: string;
    noPayments: string;
    reversalOf: string;
    reversedBadge: string;
    reverseBtn: string;
    methodNames: Record<PaymentMethod, string>;
  };
}

/**
 * A debt's ledger, oldest first.
 *
 * Reversals are appended as negative rows rather than deleting the original, so
 * both stay visible — the history is an audit trail, not a current-state view.
 */
export function PaymentHistoryList({
  payments,
  onReverse,
  locale,
  labels,
}: PaymentHistoryListProps) {
  return (
    <div>
      <p className="text-[12px] font-semibold tracking-wider uppercase text-ink-400 mb-2">
        {labels.historyTitle}
      </p>

      {payments.length === 0 ? (
        <p className="text-[13px] text-ink-500 py-6 text-center bg-page border border-border rounded-xl">
          {labels.noPayments}
        </p>
      ) : (
        <div className="border border-border rounded-xl divide-y divide-border max-h-72 overflow-y-auto">
          {payments.map((p) => {
            // A reversal can't itself be reversed, and neither can one already
            // undone — so the button simply isn't offered.
            const canReverse = Boolean(onReverse) && !p.is_reversal && !p.isReversed;

            return (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  p.is_reversal && 'bg-danger-100/25',
                  p.isReversed && 'opacity-60'
                )}
              >
                {p.is_reversal && (
                  <CornerDownRight size={14} className="text-danger-700 shrink-0" />
                )}

                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-ink-700">
                    {p.is_reversal && p.reverses_payment_id != null
                      ? labels.reversalOf.replace('{id}', String(p.reverses_payment_id))
                      : labels.methodNames[p.method]}
                  </span>
                  <span className="block text-[12px] text-ink-400">
                    {formatDateTime(p.paid_at, locale)}
                    {p.note && (
                      <>
                        <span className="mx-1.5 text-ink-300">·</span>
                        {p.note}
                      </>
                    )}
                  </span>
                </span>

                {p.isReversed && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sand-200 text-ink-500">
                    {labels.reversedBadge}
                  </span>
                )}

                <span
                  className={cn(
                    'font-mono text-[13px] font-bold tabular-nums shrink-0',
                    p.is_reversal ? 'text-danger-700' : 'text-success-700',
                    p.isReversed && 'line-through'
                  )}
                >
                  {formatMoney(p.amount)}
                </span>

                {canReverse && (
                  <button
                    onClick={() => onReverse?.(p)}
                    aria-label={`${labels.reverseBtn} — ${formatMoney(p.amount)}`}
                    className="shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-lg border border-border text-[12px] font-medium text-ink-600 hover:bg-danger-100/50 hover:text-danger-700 hover:border-danger-100 transition-colors"
                  >
                    <Undo2 size={12} />
                    {labels.reverseBtn}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
