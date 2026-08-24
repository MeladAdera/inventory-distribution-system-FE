'use client';

import Link from 'next/link';
import { Info, Loader2, Receipt } from 'lucide-react';
import { cn } from '@/common/utils/cn';
import { Drawer } from '@/common/components';
import { Button, buttonVariants } from '@/common/components/ui/button';
import { ROUTES } from '@/common/constants/app.constants';
import { compareMoney, formatMoneyGrouped } from '@/common/utils/money';
import { useShiftSessionDetail } from '../../hooks/useShiftSessions';
import type { ShiftSessionDetail, ShiftSessionReceipt } from '../../types/shifts.types';
import { formatDuration } from '../../utils/time.utils';
import { StatusBadge } from '../ui/StatusBadge';
import { VarianceValue, varianceTone } from '../ui/VarianceValue';

export interface ShiftDrawerLabels {
  title: string;
  loading: string;
  errorMsg: string;
  employee: string;
  shift: string;
  opened: string;
  closed: string;
  duration: string;
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
  timeline: string;
  walkIn: string;
  cancelled: string;
  free: string;
  onCredit: string;
  cancelledHint: string;
  creditGapNote: string;
  viewReceipts: string;
  done: string;
}

interface Props {
  /** Null keeps the query idle and the drawer shut. */
  sessionId: number | null;
  onClose: () => void;
  currency: string;
  userNames: Map<number, string>;
  formatDay: (date: string) => string;
  formatTime: (iso: string) => string;
  labels: ShiftDrawerLabels;
  noSlotLabel: string;
  stillOpenLabel: string;
  notCountedLabel: string;
  statusLabels: { completed: string; open: string };
}

/**
 * One shift, opened beside the list rather than on top of it.
 *
 * A drawer instead of a modal because reading a shift is something an owner
 * does repeatedly while working down a week — a modal makes each one feel like
 * leaving the page and coming back.
 */
export function ShiftDrawer({
  sessionId,
  onClose,
  currency,
  userNames,
  formatDay,
  formatTime,
  labels,
  noSlotLabel,
  stillOpenLabel,
  notCountedLabel,
  statusLabels,
}: Props) {
  const { session, isLoading, error } = useShiftSessionDetail(sessionId);

  return (
    <Drawer
      open={sessionId !== null}
      onClose={onClose}
      title={session ? formatDay(session.business_date) : labels.title.replace('{date}', '')}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {session && (
            /* The receipts list takes a date range, so the shift's own trading
               day is the closest honest link. There is no per-shift filter. */
            <Link
              href={`${ROUTES.CLIENT_RECEIPTS}?fromDate=${session.business_date}&toDate=${session.business_date}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <Receipt size={14} />
              {labels.viewReceipts}
            </Link>
          )}
          <Button size="sm" onClick={onClose}>
            {labels.done}
          </Button>
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
        <Body
          session={session}
          currency={currency}
          userNames={userNames}
          formatTime={formatTime}
          labels={labels}
          noSlotLabel={noSlotLabel}
          stillOpenLabel={stillOpenLabel}
          notCountedLabel={notCountedLabel}
          statusLabels={statusLabels}
        />
      )}
    </Drawer>
  );
}

function Body({
  session,
  currency,
  userNames,
  formatTime,
  labels,
  noSlotLabel,
  stillOpenLabel,
  notCountedLabel,
  statusLabels,
}: {
  session: ShiftSessionDetail;
  currency: string;
  userNames: Map<number, string>;
  formatTime: (iso: string) => string;
  labels: ShiftDrawerLabels;
  noSlotLabel: string;
  stillOpenLabel: string;
  notCountedLabel: string;
  statusLabels: { completed: string; open: string };
}) {
  const closedByName =
    session.closed_by !== null && session.closed_by !== session.user_id
      ? userNames.get(session.closed_by)
      : undefined;

  const elapsed = session.closed_at
    ? Math.round(
        (new Date(session.closed_at).getTime() - new Date(session.opened_at).getTime()) / 60_000
      )
    : null;

  const hasCancelled = session.receipts.some((r) => r.is_cancelled);
  // Sold more than reached the till, and there are credit sales to explain it.
  // Without this line the gap reads as missing cash.
  const creditExplainsGap =
    session.expected_cash !== null &&
    compareMoney(session.sales_total, session.expected_cash) > 0 &&
    session.receipts.some((r) => r.on_credit);

  const diffTone = session.cash_difference ? varianceTone(session.cash_difference) : 'zero';

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink-900">{session.user_name}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-500">
            {session.shift_template_name ?? <span className="text-ink-faint">{noSlotLabel}</span>}
          </p>
          {closedByName && (
            <p className="mt-0.5 text-[12px] text-ink-400">
              {labels.closedBy}: {closedByName}
            </p>
          )}
        </div>
        <StatusBadge
          kind={session.closed_at ? 'completed' : 'open'}
          label={session.closed_at ? statusLabels.completed : statusLabels.open}
        />
      </div>

      {/* Start, end, length — the shape of the shift before any money. */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Tile label={labels.opened} value={formatTime(session.opened_at)} ltr />
        <Tile
          label={labels.closed}
          value={session.closed_at ? formatTime(session.closed_at) : stillOpenLabel}
          ltr={Boolean(session.closed_at)}
        />
        <Tile
          label={labels.duration}
          value={elapsed !== null ? formatDuration(elapsed) : '—'}
          ltr={elapsed !== null}
        />
      </div>

      {/* Cash reconciliation: float in, money through, what should be there,
          what was counted, and the gap called out in its own tinted row. */}
      <section className="mt-4 overflow-hidden rounded-lg border border-border">
        <Line label={labels.openingFloat} value={session.opening_float} currency={currency} />
        <Line label={labels.sold} value={session.sales_total} currency={currency} />
        <Line
          label={labels.inDrawer}
          value={session.expected_cash}
          currency={currency}
          placeholder={notCountedLabel}
          strong
        />
        <Line
          label={labels.counted}
          value={session.counted_cash}
          currency={currency}
          placeholder={notCountedLabel}
          strong
        />
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-t px-3 py-2.5',
            diffTone === 'pos'
              ? 'border-success-200 bg-success-50'
              : diffTone === 'neg'
                ? 'border-danger-200 bg-danger-50'
                : 'border-border bg-neutral-50'
          )}
        >
          <span className="text-[13px] font-medium text-ink-700">{labels.difference}</span>
          <VarianceValue
            value={session.cash_difference}
            placeholder={notCountedLabel}
            currency={currency}
            className="text-[14px]"
          />
        </div>
      </section>

      {creditExplainsGap && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-subtle px-3 py-2 text-[12px] leading-relaxed text-ink-500">
          <Info size={13} className="mt-0.5 shrink-0" />
          {labels.creditGapNote}
        </p>
      )}

      {session.notes && (
        <p className="mt-3 rounded-lg bg-sand-100 px-3 py-2 text-[13px] text-ink-600">
          <span className="text-ink-400">{labels.notes}: </span>
          {session.notes}
        </p>
      )}

      <h3 className="mt-5 flex items-baseline gap-2 text-[13.5px] font-semibold text-ink-900">
        {labels.timeline}
        <span className="text-[12px] font-normal text-ink-400">
          {labels.receiptCount.replace('{count}', String(session.receipt_count))}
        </span>
      </h3>

      {hasCancelled && (
        <p className="mt-2 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          {labels.cancelledHint}
        </p>
      )}

      {session.receipts.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-faint">{labels.noReceipts}</p>
      ) : (
        <ol className="mt-3 border-s border-border ps-4">
          {session.receipts.map((receipt) => (
            <TimelineRow
              key={receipt.id}
              receipt={receipt}
              currency={currency}
              formatTime={formatTime}
              labels={labels}
            />
          ))}
        </ol>
      )}
    </>
  );
}

function TimelineRow({
  receipt,
  currency,
  formatTime,
  labels,
}: {
  receipt: ShiftSessionReceipt;
  currency: string;
  formatTime: (iso: string) => string;
  labels: ShiftDrawerLabels;
}) {
  return (
    <li className="relative py-2.5">
      <span className="absolute -inset-s-5.5 top-4 h-1.5 w-1.5 rounded-full bg-ink-200" />
      <div className="flex items-start justify-between gap-3">
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
            <span dir="ltr">{formatTime(receipt.created_at)}</span>
            <span>· {receipt.created_by_name}</span>
            {receipt.is_cancelled && <Tag tone="danger">{labels.cancelled}</Tag>}
            {receipt.is_free && <Tag tone="info">{labels.free}</Tag>}
            {receipt.on_credit && <Tag tone="warning">{labels.onCredit}</Tag>}
          </p>
        </div>
        <span
          dir="ltr"
          className={cn(
            'shrink-0 text-[13px] tabular-nums',
            receipt.is_cancelled ? 'text-ink-400 line-through' : 'text-ink-700'
          )}
        >
          {formatMoneyGrouped(receipt.total_price)} {currency}
        </span>
      </div>
    </li>
  );
}

const TAG_TONES = {
  danger: 'bg-danger-50 text-danger-700',
  info: 'bg-info-100 text-info-700',
  warning: 'bg-warning-50 text-warning-700',
};

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: React.ReactNode }) {
  return (
    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', TAG_TONES[tone])}>
      {children}
    </span>
  );
}

function Tile({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-subtle px-3 py-2">
      <p className="truncate text-[11px] text-ink-400">{label}</p>
      <p
        className="mt-0.5 truncate text-[13.5px] font-semibold text-ink-900"
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Line({
  label,
  value,
  currency,
  placeholder = '—',
  strong = false,
}: {
  label: string;
  value: string | null;
  currency: string;
  placeholder?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-0">
      <span className={cn('text-[13px]', strong ? 'font-medium text-ink-700' : 'text-ink-500')}>
        {label}
      </span>
      <span
        dir="ltr"
        className={cn(
          'tabular-nums',
          strong ? 'text-[13.5px] font-semibold text-ink-900' : 'text-[13px] text-ink-700'
        )}
      >
        {value === null ? (
          <span className="text-ink-400">{placeholder}</span>
        ) : (
          `${formatMoneyGrouped(value)} ${currency}`
        )}
      </span>
    </div>
  );
}
