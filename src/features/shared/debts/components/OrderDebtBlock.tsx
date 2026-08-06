'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatMoney, isPositiveMoney } from '@/common/utils/money';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { useOrderDebt, useRecordOrderPayment } from '../hooks/useOrderDebt';
import { DebtStatusBadge } from './DebtStatusBadge';
import { RecordOrderPaymentModal } from './RecordOrderPaymentModal';
import { DebtStatus } from '../types/debts.types';

interface OrderDebtBlockProps {
  orderId: number | null;
  orderStatus?: OrderStatus;
  /** Only the warehouse admin receives the money, so only they may record it. */
  canRecordPayment?: boolean;
  /** Names the payer in the record-payment modal. */
  shopName?: string;
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wider uppercase text-ink-400">{label}</p>
      <p className={`font-mono text-[14px] font-bold tabular-nums ${tone ?? 'text-ink-900'}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * What a shop still owes the warehouse for one order, and — for the admin —
 * the place to record money against it.
 *
 * Rendered on both sides: the admin's transfer modal, where `canRecordPayment`
 * turns on the collect button, and the shop's own order modal, where it stays
 * read-only because the warehouse is the party that takes the money.
 *
 * Unlike the rest of this module — parameterised by label props — this block
 * says the same thing in the same voice to everyone, so it reads the debts
 * namespace directly rather than threading a dozen strings through every order
 * detail modal that wants it.
 */
export function OrderDebtBlock({
  orderId,
  orderStatus,
  canRecordPayment = false,
  shopName = '',
}: OrderDebtBlockProps) {
  const { t } = useI18n();
  const toast = useToast();
  const d = t.debts;
  const { debt, nothingOwed, isLoading } = useOrderDebt(orderId, orderStatus);
  const { recordPayment, isRecording } = useRecordOrderPayment(orderId);
  const [payOpen, setPayOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-ink-400" />
      </div>
    );
  }

  if (nothingOwed) {
    return (
      <p className="text-[13px] text-ink-500 px-4 py-3 bg-page border border-border rounded-xl mb-5">
        {d.orderPayment.nothingOwed}
      </p>
    );
  }

  // Either the order hasn't shipped yet or the request hasn't resolved — there
  // is nothing meaningful to claim about the balance, so say nothing.
  if (!debt) return null;

  // Nothing left to collect on a settled debt, and a cancelled one is inert.
  const canPay =
    canRecordPayment && isPositiveMoney(debt.remaining) && debt.status !== DebtStatus.CANCELLED;

  return (
    <>
      <div className="p-4 bg-page border border-border rounded-xl mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[12px] font-medium uppercase tracking-wide text-ink-400">
            {d.orderPayment.owedLabel}
          </p>
          <DebtStatusBadge status={debt.status} label={d.status[debt.status]} small />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Figure label={d.detail.total} value={formatMoney(debt.total_amount)} />
          <Figure
            label={d.detail.paid}
            value={formatMoney(debt.paid_amount)}
            tone="text-success-700"
          />
          <Figure
            label={d.detail.remaining}
            // Always the server's remaining — never total_price minus paid. Order
            // money is a float while debt money is a 2-decimal string, and mixing
            // the two is exactly the drift money.ts exists to prevent.
            value={`${formatMoney(debt.remaining)} ${d.currency}`}
            tone="text-amber-700"
          />
        </div>

        {canPay && (
          <button
            onClick={() => setPayOpen(true)}
            className="mt-4 h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold rounded-lg transition-colors"
          >
            {d.detail.payBtn}
          </button>
        )}
      </div>

      {/* Rendered unconditionally — Modal no-ops while closed. Gating this on
          canPay would tear the modal down mid-request, since a payment that
          settles the debt flips canPay false before the mutation resolves. */}
      <RecordOrderPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        orderId={debt.order_id ?? (orderId as number)}
        shopName={shopName}
        remaining={debt.remaining}
        onSubmit={recordPayment}
        isSubmitting={isRecording}
        onRecorded={() => {
          setPayOpen(false);
          toast.success(d.orderPayment.toast);
        }}
      />
    </>
  );
}
