'use client';

import { Info, Loader2 } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Modal } from '@/common/components/Modal';
import { Button } from '@/common/components/ui/button';
import { formatMoneyGrouped } from '@/common/utils/money';
import { useShiftSessionDetail } from '../../hooks/useShiftSessions';
import type { ShiftSessionReceipt } from '../../types/shifts.types';
import { CashDifference } from './CashDifference';
import { formatBusinessDate } from './SessionsTableCard';

interface SessionDetailModalProps {
  /** Null keeps the query idle while the modal is closed. */
  sessionId: number | null;
  onClose: () => void;
  locale: string;
  currency: string;
  userNames: Map<number, string>;
  labels: {
    title: string;
    loading: string;
    errorMsg: string;
    employee: string;
    shift: string;
    opened: string;
    closed: string;
    closedBy: string;
    openingFloat: string;
    sold: string;
    inDrawer: string;
    counted: string;
    difference: string;
    notes: string;
    receipts: string;
    receiptCount: string;
    noReceipts: string;
    walkIn: string;
    cancelled: string;
    free: string;
    onCredit: string;
    cancelledHint: string;
    done: string;
  };
  noSlotLabel: string;
  stillOpenLabel: string;
  notCountedLabel: string;
}

export function SessionDetailModal({
  sessionId,
  onClose,
  locale,
  currency,
  userNames,
  labels,
  noSlotLabel,
  stillOpenLabel,
  notCountedLabel,
}: SessionDetailModalProps) {
  const { session, isLoading, error } = useShiftSessionDetail(sessionId);

  const title = session
    ? labels.title.replace('{date}', formatBusinessDate(session.business_date, locale))
    : labels.title.replace('{date}', '');

  const hasCancelled = session?.receipts.some((r) => r.is_cancelled) ?? false;

  return (
    <Modal
      open={sessionId !== null}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose}>{labels.done}</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[14px]">{labels.loading}</span>
        </div>
      ) : error || !session ? (
        <p className="py-10 text-center text-[14px] text-ink-500">{labels.errorMsg}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
            <Item label={labels.employee} value={session.user_name} />
            <Item label={labels.shift} value={session.shift_template_name ?? noSlotLabel} />
            <Item label={labels.opened} value={formatTime(session.opened_at, locale)} ltr />
            <Item
              label={labels.closed}
              value={session.closed_at ? formatTime(session.closed_at, locale) : stillOpenLabel}
              ltr={Boolean(session.closed_at)}
            />
            {/* Only worth a line when someone else counted the drawer. */}
            {session.closed_by !== null &&
              session.closed_by !== session.user_id &&
              userNames.get(session.closed_by) && (
                <Item label={labels.closedBy} value={userNames.get(session.closed_by)!} />
              )}
          </dl>

          <div className="mt-4 rounded-lg border border-border">
            <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
              {/* Sold and in-the-drawer are deliberately adjacent but distinct:
                  a credit sale raises the first without the second. */}
              <Figure label={labels.sold} value={session.sales_total} currency={currency} />
              <Figure
                label={labels.inDrawer}
                value={session.expected_cash}
                currency={currency}
                placeholder={notCountedLabel}
              />
              <Figure
                label={labels.counted}
                value={session.counted_cash}
                currency={currency}
                placeholder={notCountedLabel}
              />
              <div className="px-3 py-2.5">
                <p className="text-[11px] text-ink-400">{labels.difference}</p>
                <CashDifference
                  value={session.cash_difference}
                  placeholder={notCountedLabel}
                  className="mt-0.5 block text-[14px]"
                />
              </div>
            </div>
            <p className="border-t border-border px-3 py-2 text-[11px] text-ink-400">
              {labels.openingFloat}:{' '}
              <span className="tabular-nums" dir="ltr">
                {formatMoneyGrouped(session.opening_float)} {currency}
              </span>
            </p>
          </div>

          {session.notes && (
            <p className="mt-3 rounded-lg bg-sand-100 px-3 py-2 text-[13px] text-ink-600">
              <span className="text-ink-400">{labels.notes}: </span>
              {session.notes}
            </p>
          )}

          <h3 className="mt-5 flex items-baseline gap-2 text-[14px] font-semibold text-ink-900">
            {labels.receipts}
            <span className="text-[12px] font-normal text-ink-400">
              {labels.receiptCount.replace('{count}', String(session.receipt_count))}
            </span>
          </h3>

          {hasCancelled && (
            <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-ink-400">
              <Info size={13} className="mt-0.5 shrink-0" />
              {labels.cancelledHint}
            </p>
          )}

          {session.receipts.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-400">{labels.noReceipts}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {session.receipts.map((receipt) => (
                <ReceiptRow
                  key={receipt.id}
                  receipt={receipt}
                  locale={locale}
                  currency={currency}
                  labels={labels}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}

function ReceiptRow({
  receipt,
  locale,
  currency,
  labels,
}: {
  receipt: ShiftSessionReceipt;
  locale: string;
  currency: string;
  labels: { walkIn: string; cancelled: string; free: string; onCredit: string };
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-[13px]',
            receipt.is_cancelled ? 'text-ink-400 line-through' : 'text-ink-800'
          )}
        >
          #{receipt.id} · {receipt.customer_name ?? labels.walkIn}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-400">
          <span dir="ltr">{formatTime(receipt.created_at, locale)}</span>
          <span>· {receipt.created_by_name}</span>
          {receipt.is_cancelled && <Tag tone="danger">{labels.cancelled}</Tag>}
          {receipt.is_free && <Tag tone="info">{labels.free}</Tag>}
          {receipt.on_credit && <Tag tone="warning">{labels.onCredit}</Tag>}
        </p>
      </div>
      <span
        dir="ltr"
        className={cn(
          'shrink-0 tabular-nums text-[13px]',
          receipt.is_cancelled ? 'text-ink-400 line-through' : 'text-ink-700'
        )}
      >
        {formatMoneyGrouped(receipt.total_price)} {currency}
      </span>
    </li>
  );
}

const TAG_TONES = {
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-info-100 text-info-700',
  warning: 'bg-warning-100 text-warning-700',
};

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return (
    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', TAG_TONES[tone])}>
      {children}
    </span>
  );
}

function Item({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-ink-400">{label}</dt>
      <dd className="truncate text-[13px] text-ink-800" dir={ltr ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  );
}

function Figure({
  label,
  value,
  currency,
  placeholder = '—',
}: {
  label: string;
  value: string | null;
  currency: string;
  placeholder?: string;
}) {
  return (
    <div className="px-3 py-2.5">
      <p className="truncate text-[11px] text-ink-400">{label}</p>
      <p className="mt-0.5 text-[14px] tabular-nums text-ink-800" dir="ltr">
        {value === null ? (
          <span className="text-ink-400">{placeholder}</span>
        ) : (
          `${formatMoneyGrouped(value)} ${currency}`
        )}
      </p>
    </div>
  );
}

function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso)
  );
}
