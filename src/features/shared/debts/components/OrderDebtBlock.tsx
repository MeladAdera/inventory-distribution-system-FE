'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/providers/I18nProvider';
import { formatMoney } from '@/common/utils/money';
import { OrderStatus } from '@/features/shared/orders/types/orders.types';
import { useOrderDebt } from '../hooks/useOrderDebt';
import { DebtStatusBadge } from './DebtStatusBadge';

interface OrderDebtBlockProps {
  orderId: number | null;
  orderStatus?: OrderStatus;
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
 * What a shop still owes the warehouse for one order.
 *
 * Unlike the rest of this module — shared by both portals and parameterised by
 * label props — this block has a single caller and a single voice, so it reads
 * the debts namespace directly rather than threading a dozen strings through
 * the order detail modal.
 */
export function OrderDebtBlock({ orderId, orderStatus }: OrderDebtBlockProps) {
  const { t } = useI18n();
  const d = t.debts;
  const { debt, nothingOwed, isLoading } = useOrderDebt(orderId, orderStatus);

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

  return (
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
    </div>
  );
}
